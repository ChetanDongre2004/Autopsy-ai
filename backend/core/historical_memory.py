from typing import List, Dict, Any
from datetime import datetime

class HistoricalMemory:
    def __init__(self, db_session):
        self.session = db_session

    def get_past_findings(self, repo_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves past findings for the repository to influence current scan and avoid duplicate reporting
        or to track if a vulnerability was reopened.
        """
        # In actual implementation, we would query `repo_findings` joined with `repo_scans`
        return []

    def get_architecture_evolution(self, repo_id: str) -> List[Dict[str, Any]]:
        """
        Tracks how the architecture score or patterns changed over time.
        """
        # Query repo_trends
        return []

    def build_historical_context(self, repo_id: str) -> str:
        """
        Creates a string summary of historical context to pass to the LLM
        """
        findings = self.get_past_findings(repo_id)
        if not findings:
            return "No historical context available."
        
        return f"Found {len(findings)} previous historical findings."
