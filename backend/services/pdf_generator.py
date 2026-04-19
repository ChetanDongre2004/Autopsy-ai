import os
import time
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def generate_security_pdf(data: dict) -> str:
    pdf_path = os.path.join(tempfile.gettempdir(), f"autopsy_security_report_{int(time.time())}.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    title_style.textColor = colors.HexColor('#4f46e5')
    h2 = styles['Heading2']
    h3 = styles['Heading3']
    normal = styles['Normal']
    
    elements = []
    
    # Cover
    elements.append(Paragraph("AUTOPSY AI", title_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Executive Security Intelligence Report", styles['Heading1']))
    elements.append(Spacer(1, 50))
    
    if not data or "security_platform" not in data:
        elements.append(Paragraph("No security data provided.", normal))
        doc.build(elements)
        return pdf_path

    sec = data.get("security_platform", {})
    overview = sec.get("overview", {})

    # KPI Summary Table
    elements.append(Paragraph("KPI Summary", h2))
    table_data = [
        ["Metric", "Value"],
        ["Security Score", str(overview.get("score", "N/A"))],
        ["Total Findings", str(overview.get("total_findings", "0"))],
        ["Critical Risks", str(overview.get("critical", "0"))],
        ["High Risks", str(overview.get("high", "0"))],
        ["Medium Risks", str(overview.get("medium", "0"))],
        ["Low Risks", str(overview.get("low", "0"))],
        ["Resolved", str(overview.get("resolved", "0"))]
    ]
    
    t = Table(table_data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#18181b")),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f4f4f5")),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e4e4e7"))
    ]))
    elements.append(t)
    elements.append(Spacer(1, 30))

    # SAST Findings
    elements.append(Paragraph("Critical SAST Vulnerabilities", h2))
    sast = sec.get("sast_findings", [])
    if sast:
        for finding in sast:
            elements.append(Paragraph(f"{finding.get('title', 'Unknown')} ({finding.get('severity', 'Info')})", h3))
            elements.append(Paragraph(f"<b>Location:</b> {finding.get('file')} : line {finding.get('line')}", normal))
            elements.append(Paragraph(f"<b>Impact:</b> {finding.get('impact')}", normal))
            elements.append(Paragraph(f"<b>Fix Action:</b> {finding.get('fix')}", normal))
            elements.append(Spacer(1, 15))
    else:
        elements.append(Paragraph("No critical vulnerabilities found.", normal))
        elements.append(Spacer(1, 15))

    # Secrets
    elements.append(Paragraph("Exposed Secrets", h2))
    secrets = sec.get("secrets", [])
    if secrets:
        for s in secrets:
            elements.append(Paragraph(f"{s.get('type')} - {s.get('severity')}", h3))
            elements.append(Paragraph(f"<b>File:</b> {s.get('file')}", normal))
            elements.append(Paragraph(f"<b>Recommended Vault:</b> {s.get('fix')}", normal))
            elements.append(Spacer(1, 10))
    else:
        elements.append(Paragraph("No secrets exposed.", normal))
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated automatically by Autopsy AI DevSecOps Engine.", normal))

    doc.build(elements)
    return pdf_path
