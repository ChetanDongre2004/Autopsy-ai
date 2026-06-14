"""
GitHub HITL (Human-in-the-Loop) Governance Engine
Stores AI-generated findings in the DB and manages reviewer workflows.
No fake or mock data — everything persisted to SQLite.
"""

import uuid
import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class GithubGovernanceEngine:
    def __init__(self, session):
        self.session = session

    # ─── Internal helpers ────────────────────────────────────────────────────

    def _get_finding(self, finding_id: str):
        from services.kb_service import GithubFinding
        return self.session.query(GithubFinding).filter_by(id=finding_id).first()

    def _log_audit(self, finding_id: str, action: str, actor: str, details: str = ""):
        from services.kb_service import GithubAuditLog
        entry = GithubAuditLog(
            id=uuid.uuid4().hex,
            finding_id=finding_id,
            action=action,
            actor=actor,
            details=details,
            timestamp=time.time()
        )
        self.session.add(entry)

    # ─── Core public API ─────────────────────────────────────────────────────

    def create_findings_from_scan(
        self,
        repo_id: str,
        repo_name: str,
        branch: str,
        ai_findings: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Persist a list of AI-generated findings to the database.
        Each finding will appear in the review queue.
        Returns the list of created finding IDs.
        """
        from services.kb_service import GithubFinding, GithubSLATracking

        # SLA deadlines by severity (seconds from now)
        SLA_HOURS = {"Critical": 4, "High": 24, "Medium": 72, "Low": 168}

        created_ids = []
        for finding in ai_findings:
            severity = finding.get("severity", "Medium")
            finding_id = uuid.uuid4().hex
            now = time.time()

            db_finding = GithubFinding(
                id=finding_id,
                repository_id=repo_id,
                branch=branch,
                module="github_intelligence",
                finding_type=finding.get("type", "Architecture Insight"),
                title=finding.get("title", "Untitled Finding"),
                severity=severity,
                confidence_score=float(finding.get("confidence", 0.85)),
                business_impact=finding.get("impact", ""),
                architecture_impact=finding.get("architecture_impact", ""),
                affected_files=",".join(finding.get("files", [])),
                affected_modules=",".join(finding.get("modules", [])),
                evidence=finding.get("evidence", ""),
                ai_reasoning=finding.get("reasoning", ""),
                remediation=finding.get("remediation", ""),
                status="PENDING_REVIEW",
                reviewer=None,
                assigned_team=finding.get("team", self._infer_team(finding.get("title", ""), severity)),
                created_at=now,
            )
            self.session.add(db_finding)

            # SLA tracking
            hours = SLA_HOURS.get(severity, 72)
            sla = GithubSLATracking(
                id=uuid.uuid4().hex,
                finding_id=finding_id,
                severity=severity,
                deadline=now + hours * 3600,
                breached=False,
                escalated=False,
            )
            self.session.add(sla)
            created_ids.append(finding_id)

        try:
            self.session.commit()
            logger.info(f"[GithubGovernance] Persisted {len(created_ids)} findings for repo {repo_id}")
        except Exception as e:
            self.session.rollback()
            logger.error(f"[GithubGovernance] DB commit failed: {e}")

        return created_ids

    def get_review_queue(self) -> List[Dict[str, Any]]:
        """Return all findings pending human review."""
        from services.kb_service import GithubFinding, GithubSLATracking

        findings = (
            self.session.query(GithubFinding)
            .filter_by(status="PENDING_REVIEW")
            .order_by(GithubFinding.created_at.desc())
            .limit(100)
            .all()
        )

        queue = []
        for f in findings:
            sla = (
                self.session.query(GithubSLATracking)
                .filter_by(finding_id=f.id)
                .first()
            )
            hours_left = None
            is_breached = False
            if sla:
                remaining = sla.deadline - time.time()
                hours_left = round(remaining / 3600, 1)
                is_breached = remaining < 0

            queue.append({
                "id": f.id,
                "title": f.title,
                "finding_type": f.finding_type,
                "severity": f.severity,
                "confidence_score": f.confidence_score,
                "status": f.status,
                "assigned_team": f.assigned_team,
                "branch": f.branch,
                "evidence": f.evidence,
                "ai_reasoning": f.ai_reasoning,
                "remediation": f.remediation,
                "affected_files": f.affected_files.split(",") if f.affected_files else [],
                "sla_hours_remaining": hours_left,
                "sla_breached": is_breached,
                "created_at": f.created_at,
            })

        return queue

    def get_tasks(self) -> List[Dict[str, Any]]:
        """Return all governance tasks."""
        from services.kb_service import GithubTask, GithubFinding

        tasks = (
            self.session.query(GithubTask)
            .order_by(GithubTask.created_at.desc())
            .limit(100)
            .all()
        )

        result = []
        for t in tasks:
            finding = self.session.query(GithubFinding).filter_by(id=t.finding_id).first()
            result.append({
                "id": t.id,
                "finding_id": t.finding_id,
                "finding_title": finding.title if finding else "Unknown",
                "severity": finding.severity if finding else "Medium",
                "assigned_team": t.assigned_team,
                "status": t.status,
                "retest_status": t.retest_status,
                "created_at": t.created_at,
                "eta": t.eta,
            })

        return result

    def submit_decision(
        self,
        finding_id: str,
        reviewer: str,
        decision: str,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Persist a human reviewer decision for a finding.
        Decision values: APPROVED, REJECTED, ESCALATED, DEFERRED
        """
        from services.kb_service import GithubFinding, GithubReviewDecision, GithubTask

        finding = self._get_finding(finding_id)
        if not finding:
            return {"error": f"Finding {finding_id} not found."}

        valid = {"APPROVED", "REJECTED", "ESCALATED", "DEFERRED"}
        if decision.upper() not in valid:
            return {"error": f"Invalid decision '{decision}'. Must be one of: {valid}"}

        decision = decision.upper()

        # Persist review decision
        review = GithubReviewDecision(
            id=uuid.uuid4().hex,
            finding_id=finding_id,
            decision=decision,
            reviewer=reviewer,
            notes=notes,
            timestamp=time.time(),
        )
        self.session.add(review)

        # Update finding status
        status_map = {
            "APPROVED": "APPROVED",
            "REJECTED": "REJECTED",
            "ESCALATED": "ESCALATED",
            "DEFERRED": "DEFERRED",
        }
        finding.status = status_map[decision]
        finding.reviewer = reviewer

        # If approved, create a task automatically
        if decision == "APPROVED":
            task = GithubTask(
                id=uuid.uuid4().hex,
                finding_id=finding_id,
                assigned_team=finding.assigned_team or "Backend Team",
                eta=time.time() + 7 * 86400,  # 7 days default
                status="OPEN",
                retest_status="PENDING",
                created_at=time.time(),
            )
            self.session.add(task)

        self._log_audit(finding_id, f"DECISION_{decision}", reviewer, notes)

        try:
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            logger.error(f"[GithubGovernance] submit_decision DB error: {e}")
            return {"error": str(e)}

        return {
            "status": "success",
            "finding_id": finding_id,
            "decision": decision,
            "reviewer": reviewer,
        }

    # ─── Private helpers ─────────────────────────────────────────────────────

    def _infer_team(self, title: str, severity: str) -> str:
        title_lower = title.lower()
        if any(w in title_lower for w in ["secret", "credential", "auth", "jwt", "xss", "sql injection", "security"]):
            return "Security Team"
        if any(w in title_lower for w in ["docker", "ci", "deploy", "pipeline", "workflow"]):
            return "DevOps Team"
        if any(w in title_lower for w in ["test", "coverage", "qa", "spec"]):
            return "QA Team"
        if any(w in title_lower for w in ["architecture", "module", "coupling", "monolith"]):
            return "Architecture Team"
        return "Backend Team"
