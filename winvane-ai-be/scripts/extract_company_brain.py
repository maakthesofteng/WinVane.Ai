import io
import json
import re
import sys

import pdfplumber

MAX_PAGES = 30
MAX_TEXT_LENGTH = 100_000

LABELS = {
    "techStacks": {
        "tech stack",
        "tech stack delivered",
        "tech stacks",
        "technology stack",
        "technologies",
        "technologies used",
        "technology",
        "tools and technologies",
    },
    "industries": {"industries served", "industries", "industry"},
    "services": {"services offered", "services", "service lines"},
    "targetRegions": {
        "target regions",
        "target region",
        "regions served",
        "regions",
        "locations",
    },
    "companySizeBand": {
        "company size",
        "company size band",
        "company size range",
        "team size",
    },
    "pricingRange": {"pricing range", "price range", "budget range"},
    "pricingModel": {"pricing model", "commercial model"},
    "summary": {
        "company summary",
        "company overview",
        "summary",
        "about the company",
        "about us",
    },
    "websiteUrl": {"website", "website url", "company website"},
}
LIST_FIELDS = {"techStacks", "industries", "services", "targetRegions"}
CONTACT_LABELS = {
    "name": {"name", "full name", "employee name", "contact name"},
    "workEmail": {"work email", "email", "email address", "business email"},
    "contactNumber": {
        "contact number",
        "phone",
        "phone number",
        "work phone",
        "mobile",
    },
    "jobTitle": {"job title", "title", "role", "position"},
}
CASE_STUDY_LABELS = {
    "clientName": {"client", "client name", "customer", "customer name"},
    "industry": {"industry", "client industry"},
    "Challenge": {"challenge", "problem", "context"},
    "Solution": {"solution", "approach", "services delivered"},
    "Results": {"results", "outcomes", "impact", "results and impact"},
}


def normalize_label(value):
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def split_list(value):
    return [
        item.strip(" \t-*")
        for item in re.split(r"[,;\n]", value)
        if item.strip(" \t-*")
    ][:50]


def parse_contact_lines(lines):
    labels = {
        normalize_label(label): field
        for field, names in CONTACT_LABELS.items()
        for label in names
    }
    contacts = []
    current = None
    in_contact_section = False

    def finish_contact():
        nonlocal current
        if current and current.get("name") and current.get("workEmail"):
            contacts.append(
                {
                    "name": current["name"][:120],
                    "workEmail": current["workEmail"][:254],
                    "contactNumber": current.get("contactNumber", "")[:32],
                    "jobTitle": current.get("jobTitle", "")[:120],
                }
            )
        current = None

    for line in lines:
        stripped = line.strip()
        normalized = normalize_label(stripped.rstrip(":"))
        if re.match(
            r"^\s*(?:case\s*study|project)\s*(?:#?\d+)?\s*(?::|[-—])",
            stripped,
            re.IGNORECASE,
        ):
            finish_contact()
            in_contact_section = False
            continue
        if normalized in {
            "employees",
            "employee details",
            "team members",
            "key employees",
            "key contacts",
            "company contacts",
            "leadership team",
        }:
            in_contact_section = True
            continue

        header = re.match(
            r"^\s*(?:employee|team member|contact)(?:\s*#?\d+)?\s*:\s*(.*?)\s*$",
            stripped,
            re.IGNORECASE,
        )
        if header:
            finish_contact()
            current = {}
            in_contact_section = True
            if header.group(1):
                current["name"] = header.group(1).strip()
            continue

        match = re.match(r"^\s*([^:]{2,50})\s*:\s*(.*?)\s*$", stripped)
        if match:
            field = labels.get(normalize_label(match.group(1)))
            if field:
                if field == "name" and current and current.get("workEmail"):
                    finish_contact()
                if current is None:
                    if field != "name" and not in_contact_section:
                        continue
                    current = {}
                if field == "name":
                    in_contact_section = True
                if match.group(2):
                    current[field] = match.group(2).strip()
                continue

        if current and not stripped:
            finish_contact()
            continue

        if stripped and in_contact_section and current is None:
            in_contact_section = False

    finish_contact()
    return contacts[:100]


def rich_text_document(sections):
    content = []
    for heading, paragraphs in sections:
        if heading:
            content.append(
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": heading}],
                }
            )
        for paragraph in paragraphs:
            if paragraph.strip():
                content.append(
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": paragraph.strip()}],
                    }
                )
    return {"type": "doc", "content": content or [{"type": "paragraph"}]}


def parse_case_studies(lines):
    label_map = {
        normalize_label(label): field
        for field, names in CASE_STUDY_LABELS.items()
        for label in names
    }
    studies = []
    current = None
    active_section = ""
    section_values = {}

    def finish_study():
        nonlocal current, section_values, active_section
        if current and current.get("title"):
            sections = [
                (heading, [value])
                for heading, value in section_values.items()
                if value.strip()
            ]
            studies.append(
                {
                    "title": current["title"][:200],
                    "clientName": current.get("clientName", "")[:160],
                    "industry": current.get("industry", "")[:120],
                    "content": rich_text_document(sections),
                }
            )
        current = None
        section_values = {}
        active_section = ""

    for line in lines:
        stripped = line.strip()
        header = re.match(
            r"^\s*(?:case\s*study|project)\s*(?:#?\d+)?\s*(?::|[-—])\s*(.*?)\s*$",
            stripped,
            re.IGNORECASE,
        )
        if header:
            finish_study()
            current = {"title": header.group(1).strip()}
            continue
        if normalize_label(stripped.rstrip(":")) in {"case studies", "selected projects"}:
            finish_study()
            continue
        if current is None:
            continue
        if not stripped:
            active_section = ""
            continue

        field_match = re.match(r"^\s*([^:]{2,60})\s*:\s*(.*?)\s*$", stripped)
        if field_match:
            field = label_map.get(normalize_label(field_match.group(1)))
            if field == "clientName":
                current[field] = field_match.group(2).strip()
                active_section = ""
                continue
            if field == "industry":
                current[field] = field_match.group(2).strip()
                active_section = ""
                continue
            if field in {"Challenge", "Solution", "Results"}:
                active_section = field
                value = field_match.group(2).strip()
                if value:
                    section_values[active_section] = (
                        f"{section_values.get(active_section, '')} {value}".strip()
                    )
                continue

        if active_section:
            section_values[active_section] = (
                f"{section_values.get(active_section, '')} {stripped}".strip()
            )
        elif "Overview" not in section_values:
            section_values["Overview"] = stripped
        else:
            section_values["Overview"] = (
                f"{section_values['Overview']} {stripped}".strip()
            )

    finish_study()
    return studies[:50]


def parse_profile_text(text):
    labels = {
        normalize_label(label): field
        for field, names in LABELS.items()
        for label in names
    }
    values = {}
    lines = text.splitlines()
    active_field = ""

    for line in lines:
        stripped = line.strip()
        label_match = re.match(
            r"^\s*([A-Za-z][A-Za-z /&_-]{1,60})\s*:?\s*(.*?)\s*$",
            stripped,
        )
        field = (
            labels.get(normalize_label(label_match.group(1)))
            if label_match
            else None
        )
        if field:
            value = label_match.group(2).strip()
            active_field = field if field == "summary" and value else ""
            if not value:
                active_field = field
                continue
            if field in LIST_FIELDS:
                values[field] = split_list(value)
            elif field == "summary":
                values[field] = value[:2000]
            else:
                values[field] = value[:2048]
            continue

        if active_field == "summary" and stripped:
            values["summary"] = f"{values['summary']} {stripped}".strip()[:2000]
        elif active_field in LIST_FIELDS and stripped:
            values[active_field] = (
                values.get(active_field, []) + split_list(stripped)
            )[:50]
        elif stripped:
            active_field = ""

    contacts = parse_contact_lines(lines)
    case_studies = parse_case_studies(lines)
    return {
        "fields": values,
        "contacts": contacts,
        "caseStudies": case_studies,
    }


def extract_pdf(pdf_bytes):
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as document:
        if len(document.pages) > MAX_PAGES:
            raise ValueError(f"PDF exceeds the {MAX_PAGES}-page extraction limit")
        text = "\n".join(page.extract_text() or "" for page in document.pages)

    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH]
    return parse_profile_text(text)


def main():
    try:
        profile = extract_pdf(sys.stdin.buffer.read())
        sys.stdout.write(json.dumps(profile, ensure_ascii=True))
    except Exception as error:
        sys.stderr.write(f"{type(error).__name__}: {error}\n")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
