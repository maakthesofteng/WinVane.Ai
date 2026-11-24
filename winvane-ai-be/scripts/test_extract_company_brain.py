import json
from pathlib import Path
import subprocess
import sys
import unittest

from extract_company_brain import extract_pdf, parse_profile_text


def create_text_pdf(lines):
    def escape_pdf_text(text):
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    text_commands = " ".join(
        f"({escape_pdf_text(line)}) Tj T*" for line in lines
    )
    content = f"BT /F1 12 Tf 14 TL 72 720 Td {text_commands} ET".encode("ascii")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length "
        + str(len(content)).encode("ascii")
        + b" >>\nstream\n"
        + content
        + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(pdf)


class ParseProfileTextTests(unittest.TestCase):
    def test_extracts_fields_from_a_text_pdf(self):
        pdf = create_text_pdf(
            [
                "Tech Stack Delivered: React, Node.js",
                "Website URL: https://example.com",
            ]
        )

        self.assertEqual(
            extract_pdf(pdf),
            {
                "fields": {
                    "techStacks": ["React", "Node.js"],
                    "websiteUrl": "https://example.com",
                },
                "contacts": [],
                "caseStudies": [],
            },
        )

    def test_runs_extractor_with_the_active_python_environment(self):
        pdf = create_text_pdf(["Website URL: https://example.com"])
        script_path = Path(__file__).with_name("extract_company_brain.py")
        result = subprocess.run(
            [sys.executable, str(script_path)],
            input=pdf,
            capture_output=True,
            check=True,
        )

        self.assertEqual(
            json.loads(result.stdout),
            {
                "fields": {"websiteUrl": "https://example.com"},
                "contacts": [],
                "caseStudies": [],
            },
        )

    def test_extracts_supported_company_brain_labels(self):
        profile = parse_profile_text(
            "\n".join(
                [
                    "Technology Stack: React, Node.js; PostgreSQL",
                    "Industries Served: Healthcare, Finance",
                    "Services Offered: Product development, Cloud migration",
                    "Target Regions: North America",
                    "Company Size: 11-50 employees",
                    "Pricing Range: $50,000-$100,000",
                    "Pricing Model: Fixed price",
                    "Company Summary: We build secure products.",
                    "Website URL: https://example.com",
                ]
            )
        )

        self.assertEqual(
            profile["fields"]["techStacks"], ["React", "Node.js", "PostgreSQL"]
        )
        self.assertEqual(profile["fields"]["industries"], ["Healthcare", "Finance"])
        self.assertEqual(
            profile["fields"]["services"],
            ["Product development", "Cloud migration"],
        )
        self.assertEqual(profile["fields"]["targetRegions"], ["North America"])
        self.assertEqual(profile["fields"]["companySizeBand"], "11-50 employees")
        self.assertEqual(profile["fields"]["pricingRange"], "$50,000-$100,000")
        self.assertEqual(profile["fields"]["pricingModel"], "Fixed price")
        self.assertEqual(profile["fields"]["summary"], "We build secure products.")
        self.assertEqual(profile["fields"]["websiteUrl"], "https://example.com")

    def test_ignores_unknown_and_empty_fields(self):
        self.assertEqual(
            parse_profile_text("Contact: hello@example.com\nServices: \n"),
            {"fields": {}, "contacts": [], "caseStudies": []},
        )

    def test_extracts_employee_contacts_and_case_studies(self):
        profile = parse_profile_text(
            "\n".join(
                [
                    "Employees",
                    "Employee: Avery Johnson",
                    "Work email: avery@example.com",
                    "Contact number: +1 555 010 1234",
                    "Job title: Delivery Lead",
                    "Case Study: Claims platform modernization",
                    "Client: Northwind Health",
                    "Industry: Healthcare",
                    "Challenge: Legacy claims processing was slow.",
                    "Solution: We built a secure processing platform.",
                    "Results: Processing time decreased by 40%.",
                ]
            )
        )

        self.assertEqual(
            profile["contacts"],
            [
                {
                    "name": "Avery Johnson",
                    "workEmail": "avery@example.com",
                    "contactNumber": "+1 555 010 1234",
                    "jobTitle": "Delivery Lead",
                }
            ],
        )
        self.assertEqual(len(profile["caseStudies"]), 1)
        case_study = profile["caseStudies"][0]
        self.assertEqual(case_study["title"], "Claims platform modernization")
        self.assertEqual(case_study["clientName"], "Northwind Health")
        self.assertEqual(case_study["industry"], "Healthcare")
        self.assertEqual(case_study["content"]["type"], "doc")
        self.assertEqual(
            [
                (
                    node["type"],
                    node["content"][0]["text"],
                )
                for node in case_study["content"]["content"]
            ],
            [
                ("heading", "Challenge"),
                ("paragraph", "Legacy claims processing was slow."),
                ("heading", "Solution"),
                ("paragraph", "We built a secure processing platform."),
                ("heading", "Results"),
                ("paragraph", "Processing time decreased by 40%."),
            ],
        )


if __name__ == "__main__":
    unittest.main()
