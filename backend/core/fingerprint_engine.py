import hashlib
import json
from typing import Dict, Any

class FingerprintEngine:
    def __init__(self):
        pass

    def generate_fingerprint(self, tech_stack: Dict[str, Any], arch_type: str, test_coverage: int) -> str:
        """
        Generate unique repository fingerprints to avoid repetitive outputs across repos.
        """
        fingerprint_data = {
            "tech_stack": tech_stack,
            "architecture": arch_type,
            "test_coverage": test_coverage
        }
        fingerprint_str = json.dumps(fingerprint_data, sort_keys=True)
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()

    def compare_fingerprints(self, fp1: str, fp2: str) -> float:
        """
        Simple comparison to see if two repos are exactly the same structurally.
        In a full implementation, could calculate a distance score.
        """
        return 1.0 if fp1 == fp2 else 0.0
