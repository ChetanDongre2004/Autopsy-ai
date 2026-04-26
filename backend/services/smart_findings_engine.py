import re

class SmartFindingsEngine:
    def __init__(self):
        pass

    def get_resources(self, category: str, tech_stack: dict = None) -> list:
        category = category.lower()
        if 'security' in category or 'secret' in category or 'injection' in category:
            return [
                {"title": "AWS Secrets Manager Official Guide", "type": "Documentation", "url": "https://aws.amazon.com/secrets-manager/"},
                {"title": "OWASP Secrets Management Cheat Sheet", "type": "Article", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"},
                {"title": "Preventing SQL Injection (OWASP)", "type": "Documentation", "url": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"}
            ]
        elif 'devops' in category or 'ci' in category:
            return [
                {"title": "GitHub Actions Documentation", "type": "Documentation", "url": "https://docs.github.com/en/actions"},
                {"title": "CI/CD Best Practices Guide", "type": "Guide", "url": "https://www.redhat.com/en/topics/devops/what-is-ci-cd"},
                {"title": "Docker Build Pipeline Guide", "type": "Example", "url": "https://docs.docker.com/build/ci/github-actions/"}
            ]
        elif 'testing' in category or 'qa' in category:
            return [
                {"title": "Pytest Documentation", "type": "Documentation", "url": "https://docs.pytest.org/en/latest/"},
                {"title": "Jest Documentation", "type": "Documentation", "url": "https://jestjs.io/docs/getting-started"},
                {"title": "Writing Integration Tests Guide", "type": "Guide", "url": "https://martinfowler.com/articles/practical-test-pyramid.html"}
            ]
        elif 'architecture' in category or 'complexity' in category:
            return [
                {"title": "Refactoring Monoliths Guide", "type": "Guide", "url": "https://martinfowler.com/articles/break-monolith-into-microservices.html"},
                {"title": "Clean Architecture Documentation", "type": "Documentation", "url": "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html"},
                {"title": "Dependency Inversion Guide", "type": "Article", "url": "https://en.wikipedia.org/wiki/Dependency_inversion_principle"}
            ]
        elif 'performance' in category:
            return [
                {"title": "Big O Notation Explained", "type": "Guide", "url": "https://www.freecodecamp.org/news/big-o-notation-why-it-matters-and-why-it-doesnt-1674cfa8a23c/"},
                {"title": "Optimizing Nested Loops", "type": "Article", "url": "https://en.wikipedia.org/wiki/Time_complexity"}
            ]
        else:
            return [
                {"title": "Clean Code Best Practices", "type": "Guide", "url": "https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29"}
            ]

    def get_priority_and_eta(self, severity: str, file_count: int = 1) -> tuple:
        if severity == 'Critical':
            return 'High', '2 hrs'
        elif severity == 'High':
            return 'High', '4 hrs'
        elif severity == 'Medium':
            return 'Medium', '8 hrs'
        else:
            return 'Low', '1 day'

    def format_fix(self, issue_type: str, file_path: str, raw_fix: str, tech_stack: dict = None) -> str:
        if "God Object" in issue_type:
            return f"Split {file_path} into smaller, single-responsibility modules. Extract pure functions into a utils file, and separate database queries from business logic."
        if "CI pipeline" in issue_type:
            return f"Create .github/workflows/ci.yml that:\n1. installs dependencies\n2. runs lint\n3. runs tests\n4. builds app\n5. blocks merge on failure"
        if "Broad Exception" in issue_type:
            return f"In {file_path}, replace generic 'except Exception:' blocks with specific error catches (e.g., ValueError, KeyError) to prevent masking unexpected bugs."
        if "Nested Loop" in issue_type:
            return f"In {file_path}, refactor the nested loops. Convert the inner list to a Dictionary/Hash Map or Set first, which turns O(n²) lookups into O(n) linear time."
        if "Eval" in issue_type:
            return f"In {file_path}, completely remove the eval() statement. Use a secure JSON parser or AST literal_eval if you need to parse dynamic structures."
        if "SQL Injection" in issue_type:
            return f"In {file_path}, rewrite the SQL query using parameterized queries (e.g. cursor.execute('SELECT * FROM users WHERE id=?', [user_id])) instead of f-strings or string concatenation."
        if "setup steps" in issue_type:
            return f"Update the README.md to include:\n1. Prerequisites (e.g., Node version, Python version)\n2. Installation command (e.g., npm install)\n3. Local run command (e.g., npm run dev)\n4. Environment variables required."
        
        return raw_fix if raw_fix else "Review the affected module and apply standard refactoring patterns."

    def format_why_it_matters(self, issue_type: str, file_path: str, raw_why: str) -> str:
        if "God Object" in issue_type:
            return f"The file {file_path} is too large. This creates tight coupling, making it difficult for multiple developers to work concurrently without merge conflicts, and heavily increases the cognitive load needed to safely modify the code."
        if "CI pipeline" in issue_type:
            return f"Repository has no .github/workflows file. Pull requests are merged without automated linting, tests, or build validation, significantly increasing regression and broken deploy risk."
        if "Broad Exception" in issue_type:
            return f"Catching all exceptions generically in {file_path} means critical failures (like MemoryError, KeyboardInterrupt, or syntax errors) are swallowed silently, making debugging production crashes nearly impossible."
        if "Nested Loop" in issue_type:
            return f"Nested iterations in {file_path} scale terribly. As data grows, an O(n²) algorithm will exponentially slow down the application, causing CPU spikes and timeouts for end users."
        if "Eval" in issue_type:
            return f"Using dynamic evaluation in {file_path} provides an active vector for Remote Code Execution (RCE). If any user input reaches this function, an attacker can execute arbitrary commands on the server."
        if "SQL Injection" in issue_type:
            return f"Formatting strings directly into SQL queries in {file_path} allows attackers to manipulate the query structure. They could dump the entire database, bypass authentication, or drop critical tables."
        if "setup steps" in issue_type:
            return f"Missing documentation in {file_path} heavily penalizes the Developer Experience (DX). It increases onboarding time for new hires and causes inconsistent local environments."
            
        return raw_why if raw_why else "This issue impacts the overall maintainability and stability of the platform."

    def generate_recommendation(self, insight: dict, tech_stack: dict = None) -> dict:
        category = insight.get('category', 'Architecture')
        severity = insight.get('severity', 'Medium')
        file_path = insight.get('file_path', 'unknown file')
        issue_type = insight.get('issue', '')
        raw_fix = insight.get('fix_code', '')
        raw_why = insight.get('why', '')
        owner = insight.get('owner', 'Backend Team')

        priority, eta = self.get_priority_and_eta(severity)
        
        fix = self.format_fix(issue_type, file_path, raw_fix, tech_stack)
        why = self.format_why_it_matters(issue_type, file_path, raw_why)
        resources = self.get_resources(category, tech_stack)

        return {
            "priority": priority,
            "effort": "Low" if severity in ['Low', 'Medium'] else "Medium",
            "impact": category,
            "eta": eta,
            "owner": owner,
            "title": issue_type,
            "why_this_matters": why,
            "fix": fix,
            "benefit": f"Improves {category.lower()} posture and reduces technical debt.",
            "learn_more": resources
        }
