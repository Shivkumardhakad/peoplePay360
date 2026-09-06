package com.dj.payroll.services;

import com.dj.payroll.dto.PayslipDtos;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Table;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PayslipPdfService {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public byte[] generate(PayslipDtos.Response payslip) {
        try {
            var output = new ByteArrayOutputStream();
            var document = new Document();
            PdfWriter.getInstance(document, output);
            document.open();
            document.add(new Paragraph("PeoplePay360 Payslip"));
            document.add(new Paragraph("Payslip ID: " + payslip.id()));
            document.add(new Paragraph("Employee ID: " + payslip.employeeId()));
            document.add(new Paragraph("Contract ID: " + payslip.contractId()));
            document.add(new Paragraph("Period: " + DATE_TIME.format(payslip.periodStart()) + " to "
                + DATE_TIME.format(payslip.periodEnd())));
            document.add(new Paragraph("Status: " + payslip.status()));
            document.add(new Paragraph("Gross: " + payslip.grossAmount()));
            document.add(new Paragraph("Deductions: " + payslip.deductionAmount()));
            document.add(new Paragraph("Net: " + payslip.netAmount()));

            var table = new Table(5);
            table.addCell("Code");
            table.addCell("Name");
            table.addCell("Category");
            table.addCell("Rate");
            table.addCell("Amount");
            for (var line : payslip.lines()) {
                table.addCell(value(line.code()));
                table.addCell(value(line.name()));
                table.addCell(value(line.categoryId()));
                table.addCell(value(line.rate()));
                table.addCell(value(line.amount()));
            }
            document.add(table);
            document.close();
            return output.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Could not generate payslip PDF", exception);
        }
    }

    private String value(Object value) {
        return value == null ? "" : value.toString();
    }
}
