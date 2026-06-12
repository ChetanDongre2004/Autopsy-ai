"""
Historical Memory Service — queries actual database records.
Replaces placeholder that returned empty lists.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class HistoricalMemory:
    """Provides historical context from previous scans for a repository."""

    def __init__(self, db_session):
        self.session = db_session

    def get_past_findings(self, repo_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves past findings for the repository to influence current scan 
        and avoid duplicate reporting or to track reopened vulnerabilities.
        """
        from services.kb_service import RepoFinding, RepoScan
        try:
            # Get scan IDs for this repository
            scans = self.session.query(RepoScan).filter_by(repo_id=repo_id).order_by(
                RepoScan.created_at.desc()
            ).limit(10).all()
            
            if not scans:
                return []

            scan_ids = [s.id for s in scans]
            findings = self.session.query(RepoFinding).filter(
                RepoFinding.scan_id.in_(scan_ids)
            ).all()

            return [
                {
                    "id": f.id,
                    "title": f.title,
                    "file_path": f.file_path,
                    "severity": f.severity,
                    "owner_team": f.owner_team,
                    "category": f.category,
                    "description": f.description,
                    "fix": f.fix,
                    "effort": f.effort,
                    "scan_id": f.scan_id
                }
                for f in findings
            ]
        except Exception as e:
            logger.warning(f"[HistoricalMemory] Failed to query past findings: {e}")
            return []

    def get_architecture_evolution(self, repo_id: str) -> List[Dict[str, Any]]:
        """
        Tracks how the architecture score and patterns changed over time.
        """
        from services.kb_service import RepoScan
        try:
            scans = self.session.query(RepoScan).filter_by(repo_id=repo_id).order_by(
                RepoScan.created_at.asc()
            ).limit(20).all()

            if not scans:
                return []

            evolution = []
            for scan in scans:
                kpis = scan.kpis or {}
                tech = scan.tech_stack or {}
                evolution.append({
                    "scan_id": scan.id,
                    "score": scan.score,
                    "branch": scan.branch,
                    "created_at": datetime.fromtimestamp(scan.created_at).isoformat() if scan.created_at else None,
                    "coverage": kpis.get("coverage"),
                    "files_scanned": kpis.get("files_scanned"),
                    "tech_stack": tech
                })

            return evolution
        except Exception as e:
            logger.warning(f"[HistoricalMemory] Failed to query architecture evolution: {e}")
            return []

    def build_historical_context(self, repo_id: str) -> str:
        """
        Creates a string summary of historical context to pass to the LLM
        for context-aware analysis.
        """
        findings = self.get_past_findings(repo_id)
        evolution = self.get_architecture_evolution(repo_id)

        if not findings and not evolution:
            return "No historical context available for this repository."

        context_parts = []

        if evolution:
            latest = evolution[-1]
            oldest = evolution[0]
            score_trend = "improving" if latest["score"] > oldest["score"] else (
                "degrading" if latest["score"] < oldest["score"] else "stable"
            )
            context_parts.append(
                f"Repository has {len(evolution)} historical scans. "
                f"Score trend: {score_trend} (from {oldest['score']} to {latest['score']})."
            )

        if findings:
            severities = {}
            for f in findings:
                sev = f.get("severity", "Unknown")
                severities[sev] = severities.get(sev, 0) + 1
            
            sev_summary = ", ".join(f"{count} {sev}" for sev, count in severities.items())
            context_parts.append(
                f"Found {len(findings)} previous findings: {sev_summary}."
            )

            # Highlight recurring issues
            recurring_files = {}
            for f in findings:
                fp = f.get("file_path", "unknown")
                recurring_files[fp] = recurring_files.get(fp, 0) + 1
            
            hot_files = [fp for fp, count in recurring_files.items() if count > 1]
            if hot_files:
                context_parts.append(
                    f"Recurring issue hotspots: {', '.join(hot_files[:5])}."
                )

        return " ".join(context_parts)
