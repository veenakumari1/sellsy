import os
import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Tuple, Dict, Any
from sqlalchemy.orm import Session

from app.models import GeneratedReport, Order, Product, Customer
from app.services.analytics_service import AnalyticsService
from app.services.product_service import ProductService
from app.services.customer_service import CustomerService

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated_files"))
os.makedirs(REPORTS_DIR, exist_ok=True)

class ReportService:
    @staticmethod
    def generate_report(
        db: Session,
        store_id: str,
        user_id: str,
        report_type: str = "executive",
        file_format: str = "pdf"
    ) -> GeneratedReport:
        kpis = AnalyticsService.get_kpis(db, store_id, days=30)
        top_prods = ProductService.get_top_products(db, store_id, limit=5)
        cust_insights = CustomerService.get_insights(db, store_id)

        report_id = str(uuid.uuid4())
        filename = f"sellsy_{report_type}_{report_id[:8]}.{file_format.lower()}"
        file_path = os.path.join(REPORTS_DIR, filename)

        title = f"Sellsy {report_type.capitalize()} Intelligence Report"

        if file_format.lower() == "csv":
            ReportService._generate_csv(file_path, kpis, top_prods, cust_insights)
        else:
            ReportService._generate_pdf(file_path, title, kpis, top_prods, cust_insights)

        report_obj = GeneratedReport(
            id=report_id,
            store_id=store_id,
            user_id=user_id,
            title=title,
            report_type=report_type,
            file_format=file_format.lower(),
            file_path=file_path,
            status="ready",
            summary_data={
                "revenue": kpis.total_revenue.value,
                "orders": kpis.total_orders.value,
                "aov": kpis.average_order_value.value,
                "customers": cust_insights.total_customers
            }
        )
        db.add(report_obj)
        db.commit()
        db.refresh(report_obj)
        return report_obj

    @staticmethod
    def _generate_csv(path: str, kpis: Any, top_prods: Any, cust_insights: Any):
        with open(path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["=== SELLSY STORE INTELLIGENCE SUMMARY ==="])
            writer.writerow(["Generated At", datetime.now(timezone.utc).isoformat()])
            writer.writerow([])
            writer.writerow(["--- KEY PERFORMANCE INDICATORS (Calculated) ---"])
            writer.writerow(["Metric", "Value", "Delta %", "Benchmark / Subtext"])
            writer.writerow(["Total Revenue", kpis.total_revenue.value, f"{kpis.total_revenue.delta_pct}%", kpis.total_revenue.subtext])
            writer.writerow(["Total Orders", kpis.total_orders.value, f"{kpis.total_orders.delta_pct}%", kpis.total_orders.subtext])
            writer.writerow(["Average Order Value", kpis.average_order_value.value, f"{kpis.average_order_value.delta_pct}%", kpis.average_order_value.subtext])
            writer.writerow(["Total Customers", kpis.total_customers.value, f"{kpis.total_customers.delta_pct}%", kpis.total_customers.subtext])
            writer.writerow(["Repeat Purchase Rate", f"{cust_insights.repeat_purchase_rate}%", "-", "Calculated cohort repeat rate"])
            writer.writerow([])
            writer.writerow(["--- TOP PERFORMING PRODUCTS (Catalog Data) ---"])
            writer.writerow(["SKU", "Title", "Price ($)", "Units Sold", "Total Revenue ($)", "Status"])
            for p in top_prods:
                writer.writerow([p.sku, p.title, p.price, p.units_sold, p.revenue_generated, p.velocity_status])
            writer.writerow([])
            writer.writerow(["--- CUSTOMER SEGMENTS (RFM Analysis) ---"])
            writer.writerow(["Segment", "Customer Count", "Total Revenue ($)", "Avg Spend ($)", "% of Base"])
            for s in cust_insights.segments:
                writer.writerow([s.display_name, s.count, s.total_revenue, s.avg_spend, f"{s.percentage_of_customers}%"])
            writer.writerow([])
            writer.writerow(["--- AI STRATEGIC RECOMMENDATIONS (Synthesized) ---"])
            for idx, rec in enumerate(cust_insights.retention_recommendations, 1):
                writer.writerow([f"Action {idx}", rec])

    @staticmethod
    def _generate_pdf(path: str, title: str, kpis: Any, top_prods: Any, cust_insights: Any):
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        doc = SimpleDocTemplate(
            path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#101828"),
            alignment=0,
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "ReportSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=18
        )
        heading_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        rec_style = ParagraphStyle(
            "RecText",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1E3A8A")
        )

        elements.append(Paragraph(title, title_style))
        elements.append(Paragraph(f"Sellsy E-commerce Intelligence • Generated {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}", subtitle_style))

        # KPI Table
        elements.append(Paragraph("1. Executive Financial Performance (Calculated Metrics)", heading_style))
        kpi_data = [
            ["Metric", "Value", "Period Delta", "Context"],
            ["Total Revenue", str(kpis.total_revenue.value), f"{kpis.total_revenue.delta_pct:+}%", str(kpis.total_revenue.subtext)],
            ["Total Orders", str(kpis.total_orders.value), f"{kpis.total_orders.delta_pct:+}%", str(kpis.total_orders.subtext)],
            ["Average Order Value", str(kpis.average_order_value.value), f"{kpis.average_order_value.delta_pct:+}%", str(kpis.average_order_value.subtext)],
            ["Repeat Purchase Rate", f"{cust_insights.repeat_purchase_rate}%", "-", "Calculated from confirmed buyer cohorts"],
            ["Average Customer LTV", f"${cust_insights.avg_customer_ltv:,.2f}", "-", "Total spend / Total shoppers"]
        ]
        t_kpi = Table(kpi_data, colWidths=[140, 110, 90, 200])
        t_kpi.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elements.append(t_kpi)
        elements.append(Spacer(1, 12))

        # Top Products Table
        elements.append(Paragraph("2. Top-Performing Products", heading_style))
        prod_data = [["Product Title", "SKU", "Price", "Units", "Revenue", "Status"]]
        for p in top_prods:
            prod_data.append([
                p.title[:28],
                p.sku or "-",
                f"${p.price:.2f}",
                str(p.units_sold),
                f"${p.revenue_generated:,.2f}",
                p.velocity_status.upper()
            ])
        t_prod = Table(prod_data, colWidths=[180, 80, 60, 50, 90, 80])
        t_prod.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elements.append(t_prod)
        elements.append(Spacer(1, 12))

        # Customer Segments Table
        elements.append(Paragraph("3. Customer Cohort Segmentation (RFM)", heading_style))
        seg_data = [["Cohort Segment", "Shoppers", "Total Revenue", "Avg Spend", "% of Base"]]
        for s in cust_insights.segments:
            seg_data.append([
                s.display_name,
                str(s.count),
                f"${s.total_revenue:,.2f}",
                f"${s.avg_spend:.2f}",
                f"{s.percentage_of_customers}%"
            ])
        t_seg = Table(seg_data, colWidths=[150, 70, 110, 100, 110])
        t_seg.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elements.append(t_seg)
        elements.append(Spacer(1, 12))

        # AI Recommendations
        elements.append(Paragraph("4. AI-Generated Growth Recommendations (Synthesized from Store Data)", heading_style))
        for idx, rec in enumerate(cust_insights.retention_recommendations, 1):
            box_data = [[Paragraph(f"<b>Recommendation {idx}:</b> {rec}", rec_style)]]
            t_rec = Table(box_data, colWidths=[540])
            t_rec.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BFDBFE")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            elements.append(t_rec)
            elements.append(Spacer(1, 6))

        doc.build(elements)
