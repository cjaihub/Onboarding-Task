import os
import markdown
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

def generate_pdf():
    pdf_filename = "PROJECT_DESIGN_AND_ENGINEERING_RATIONALE.pdf"
    doc = SimpleDocTemplate(pdf_filename, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    h1_style = ParagraphStyle('H1Style', parent=styles['Heading1'], fontSize=18, spaceBefore=20, spaceAfter=10)
    h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontSize=14, spaceBefore=15, spaceAfter=8)
    h3_style = ParagraphStyle('H3Style', parent=styles['Heading3'], fontSize=12, spaceBefore=10, spaceAfter=5)
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14
    
    Story = []
    
    # Cover Page
    Story.append(Spacer(1, 150))
    Story.append(Paragraph("Internal Incident & Work Tracker", title_style))
    Story.append(Paragraph("Product, UX & Engineering Rationale", ParagraphStyle('Subtitle', parent=title_style, fontSize=18)))
    Story.append(PageBreak())

    files = [
        "docs/PRODUCT_AND_DESIGN_RATIONALE.md",
        "docs/UI_UX_DECISION_LOG.md",
        "docs/ENGINEERING_DECISION_LOG.md",
        "docs/WORKFLOW_AND_DOMAIN_RATIONALE.md",
        "docs/REVIEWER_RESPONSE.md"
    ]

    for file_path in files:
        if not os.path.exists(file_path):
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        import re
        for line in lines:
            line = line.strip()
            if not line:
                Story.append(Spacer(1, 10))
                continue
            
            # Simple markdown parsing for the PDF
            if line.startswith('# '):
                text = line[2:]
                Story.append(Paragraph(text, h1_style))
            elif line.startswith('## '):
                text = line[3:]
                Story.append(Paragraph(text, h2_style))
            elif line.startswith('### '):
                text = line[4:]
                Story.append(Paragraph(text, h3_style))
            elif line.startswith('- '):
                text = f"• {line[2:]}"
                # bold replacement
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                Story.append(Paragraph(text, normal_style))
            elif line.startswith('> '):
                text = f"<i>{line[2:]}</i>"
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                Story.append(Paragraph(text, normal_style))
            else:
                # bold replacement
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
                Story.append(Paragraph(text, normal_style))
        
        Story.append(PageBreak())

    doc.build(Story)
    print(f"Generated {pdf_filename}")

if __name__ == '__main__':
    generate_pdf()
