import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store, User, GeneratedReport
from app.schemas import ReportGenerateRequest, ReportOut
from app.services.report_service import ReportService
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("", response_model=List[ReportOut])
def list_reports(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    reports = db.query(GeneratedReport).filter(
        GeneratedReport.store_id == current_store.id
    ).order_by(GeneratedReport.created_at.desc()).all()
    
    out = []
    for r in reports:
        download_url = f"/api/v1/reports/{r.id}/download"
        out.append(ReportOut(
            id=r.id,
            title=r.title,
            report_type=r.report_type,
            file_format=r.file_format,
            file_path=r.file_path,
            status=r.status,
            download_url=download_url,
            created_at=r.created_at
        ))
    return out

@router.post("/generate", response_model=ReportOut)
def generate_report(
    req: ReportGenerateRequest,
    current_store: Store = Depends(get_current_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report_obj = ReportService.generate_report(
        db=db,
        store_id=current_store.id,
        user_id=current_user.id,
        report_type=req.report_type,
        file_format=req.file_format
    )
    return ReportOut(
        id=report_obj.id,
        title=report_obj.title,
        report_type=report_obj.report_type,
        file_format=report_obj.file_format,
        file_path=report_obj.file_path,
        status=report_obj.status,
        download_url=f"/api/v1/reports/{report_obj.id}/download",
        created_at=report_obj.created_at
    )

@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found or still generating.")
    
    media_type = "application/pdf" if report.file_format == "pdf" else "text/csv"
    filename = os.path.basename(report.file_path)
    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename
    )

