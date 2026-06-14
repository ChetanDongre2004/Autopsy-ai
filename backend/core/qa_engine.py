"""
Real QA Engine — generates quality analysis grounded in actual scanned files.
No random data. Every metric derives from real file/test evidence.
"""
import uuid
import time
import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class QAEngine:
    def __init__(self, session, retrieval_engine, rng=None):
        self.session = session
        self.retrieval_engine = retrieval_engine
        self.rng = rng

    def generate_qa_intelligence(
        self,
        repo_id: str,
        files_cnt: int,
        test_files: List[str],
        all_files: List[str],
        file_contents: Dict[str, str],
        tech_stack: Dict[str, Any],
        coverage: int,
        llm_override: Dict = None,
    ) -> Dict[str, Any]:

        # ── Real detection ────────────────────────────────────────────────────
        # 1. Detect test frameworks present
        test_frameworks = self._detect_test_frameworks(file_contents, tech_stack)

        # 2. Analyze actual test files for patterns
        test_analysis = self._analyze_test_files(test_files, file_contents, all_files)

        # 3. Suggest real tests from LLM override if available
        suggested_tests = []
        if llm_override and "qa_suggestions" in llm_override:
            suggested_tests = llm_override["qa_suggestions"].get("suggested_tests", [])

        # Fill in real suggestions from unteested auth/api files if LLM didn't provide enough
        if len(suggested_tests) < 3:
            suggested_tests += self._generate_test_suggestions(all_files, file_contents, tech_stack)

        # 4. Build flaky test memory from DB (real historical data)
        flaky_tests = self._get_flaky_tests(repo_id)

        # 5. Compute release gate score
        release_score = self._compute_release_score(coverage, test_analysis, flaky_tests)

        # 6. LLM-provided recommendations
        llm_recs = []
        if llm_override and "qa_suggestions" in llm_override:
            llm_recs = llm_override["qa_suggestions"].get("recommendations", [])

        # 7. Historical failures from DB
        historical_failures = self._get_historical_failures(repo_id)

        return {
            "overview": {
                "test_coverage": f"{coverage}%",
                "total_test_files": len(test_files),
                "total_source_files": files_cnt,
                "test_ratio": f"{round(len(test_files) / max(files_cnt, 1) * 100, 1)}%",
                "frameworks_detected": test_frameworks,
                "release_score": release_score["score"],
                "release_decision": release_score["decision"],
            },
            "test_files": test_analysis["files"][:20],
            "coverage_gaps": test_analysis["coverage_gaps"][:10],
            "suggested_tests": suggested_tests[:10],
            "flaky_tests": flaky_tests[:10],
            "historical_failures": historical_failures[:10],
            "release_gate": release_score,
            "recommendations": llm_recs or self._default_recommendations(coverage, test_frameworks),
            "health_score": min(100, max(10, coverage + (10 if test_frameworks else 0))),
        }

    # ── Private helpers ───────────────────────────────────────────────────────

    def _detect_test_frameworks(self, file_contents: Dict, tech_stack: Dict) -> List[str]:
        found = []
        all_content = " ".join(file_contents.values()).lower()
        checks = {
            "pytest": ["import pytest", "from pytest", "def test_"],
            "unittest": ["import unittest", "unittest.TestCase"],
            "jest": ["describe(", "it(", "expect(", "jest.fn"],
            "vitest": ["import { describe", "vi.fn"],
            "playwright": ["from playwright", "import playwright"],
            "cypress": ["cy.", "cypress"],
            "mocha": ["describe(", "it(", "chai"],
        }
        for fw, patterns in checks.items():
            if any(p.lower() in all_content for p in patterns):
                found.append(fw)
        return found

    def _analyze_test_files(self, test_files: List[str], file_contents: Dict, all_files: List[str]) -> Dict:
        analyzed = []
        for tf in test_files[:20]:
            content = file_contents.get(tf, "")
            funcs = re.findall(r"def (test_\w+|it\(|describe\()", content)
            analyzed.append({
                "file": tf,
                "test_count": len(funcs),
                "test_names": funcs[:5],
                "lines": len(content.split("\n")),
            })

        # Coverage gaps = source files without corresponding test files
        source_names = {f.split("/")[-1].replace(".py", "").replace(".js", "").replace(".ts", "") for f in all_files
                        if not any(kw in f for kw in ["test", "spec", "__pycache__", ".min."])}
        tested_names = {f.split("/")[-1].replace("test_", "").replace(".test", "").replace(".spec", "")
                        .replace(".py", "").replace(".js", "") for f in test_files}
        gaps = [f for f in all_files if any(n in f for n in source_names - tested_names)
                and not any(kw in f for kw in ["test", "spec", ".min.", "package"])][:10]

        return {"files": analyzed, "coverage_gaps": gaps}

    def _generate_test_suggestions(self, all_files: List[str], file_contents: Dict, tech_stack: Dict) -> List[Dict]:
        suggestions = []
        priority_patterns = ["auth", "login", "api", "router", "controller", "service", "security", "payment"]
        langs = tech_stack.get("Languages", [])
        is_python = "Python" in langs or "python" in " ".join(langs).lower()

        for f in all_files[:30]:
            if any(p in f.lower() for p in priority_patterns) and not any(kw in f.lower() for kw in ["test", "spec"]):
                content = file_contents.get(f, "")
                functions = re.findall(r"def (\w+)\(" if is_python else r"function (\w+)\(", content)[:3]
                for func in functions:
                    if func.startswith("_"):
                        continue
                    test_code = (
                        f"def test_{func}_happy_path():\n    # Arrange\n    # Act\n    result = {func}()\n    # Assert\n    assert result is not None"
                        if is_python else
                        f"test('{func} should work', () => {{\n  const result = {func}();\n  expect(result).toBeDefined();\n}});"
                    )
                    suggestions.append({
                        "test_name": f"test_{func}_happy_path",
                        "file_path": f,
                        "description": f"Verify {func}() returns expected output under normal conditions.",
                        "mock_code": test_code,
                    })
                    if len(suggestions) >= 6:
                        break
            if len(suggestions) >= 6:
                break
        return suggestions

    def _get_flaky_tests(self, repo_id: str) -> List[Dict]:
        try:
            from services.kb_service import QAFlakyMemory
            records = self.session.query(QAFlakyMemory).filter_by(repo_id=repo_id).all()
            return [{"test_name": r.test_name, "suite": r.suite, "flake_rate": r.flake_rate,
                     "root_cause": r.root_cause} for r in records]
        except Exception:
            return []

    def _get_historical_failures(self, repo_id: str) -> List[Dict]:
        try:
            from services.kb_service import QAHistoricalFailures
            records = (self.session.query(QAHistoricalFailures)
                       .filter_by(repo_id=repo_id).order_by(QAHistoricalFailures.timestamp.desc()).limit(10).all())
            return [{"test_name": r.test_name, "error_msg": r.error_msg,
                     "ai_hypothesis": r.ai_hypothesis, "suggested_fix": r.suggested_fix} for r in records]
        except Exception:
            return []

    def _compute_release_score(self, coverage: int, test_analysis: Dict, flaky_tests: List) -> Dict:
        score = coverage
        block_reasons = []
        if coverage < 40:
            block_reasons.append(f"Test coverage critically low: {coverage}% (threshold: 40%)")
        if len(flaky_tests) > 3:
            block_reasons.append(f"{len(flaky_tests)} flaky tests detected — may cause unreliable CI.")
            score -= 10
        decision = "PASS" if not block_reasons else "BLOCK"
        return {"score": max(0, min(100, score)), "decision": decision, "block_reasons": block_reasons}

    def _default_recommendations(self, coverage: int, frameworks: List) -> List[str]:
        recs = []
        if coverage < 60:
            recs.append(f"Increase test coverage from {coverage}% to at least 60% by adding unit tests for uncovered service modules.")
        if not frameworks:
            recs.append("No test framework detected. Add pytest (Python) or Jest (JS) to enable automated testing.")
        recs.append("Add integration tests for all API endpoints to verify end-to-end request/response cycles.")
        recs.append("Implement a CI pipeline step that blocks merges when test coverage drops below threshold.")
        return recs
