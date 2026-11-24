import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ICompanyBrainRichTextNode } from '../interfaces/companyBrain.interface';

const ALLOWED_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'hardBreak',
  'horizontalRule',
  'text',
]);
const ALLOWED_MARK_TYPES = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'link',
  'textStyle',
]);
const ALLOWED_FONT_FAMILIES = new Set([
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
]);
const MAX_DOCUMENT_LENGTH = 50_000;
const MAX_DOCUMENT_NODES = 1_000;
const MAX_TEXT_LENGTH = 20_000;
const MAX_DEPTH = 12;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSafeLink(href: unknown): boolean {
  if (typeof href !== 'string' || href.length > 2048) return false;
  try {
    const url = new URL(href);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateAttributes(
  type: string,
  attrs: unknown,
  isMark: boolean,
): boolean {
  if (attrs === undefined) return true;
  if (!isPlainObject(attrs)) return false;

  if (!isMark && type === 'heading') {
    return (
      Object.keys(attrs).every((key) => key === 'level') &&
      [1, 2, 3].includes(attrs.level as number)
    );
  }

  if (!isMark && type === 'orderedList') {
    return (
      Object.keys(attrs).every((key) => key === 'start') &&
      (attrs.start === null ||
        (typeof attrs.start === 'number' &&
          Number.isInteger(attrs.start) &&
          attrs.start > 0))
    );
  }

  if (isMark && type === 'link') {
    return (
      Object.keys(attrs).every((key) =>
        ['href', 'target', 'rel', 'class'].includes(key),
      ) &&
      isSafeLink(attrs.href) &&
      (attrs.target === null ||
        attrs.target === '_blank' ||
        attrs.target === '_self') &&
      (attrs.rel === null || typeof attrs.rel === 'string') &&
      (attrs.class === null || typeof attrs.class === 'string')
    );
  }

  if (isMark && type === 'textStyle') {
    return (
      Object.keys(attrs).every((key) => key === 'fontFamily') &&
      (attrs.fontFamily === null ||
        (typeof attrs.fontFamily === 'string' &&
          ALLOWED_FONT_FAMILIES.has(attrs.fontFamily)))
    );
  }

  return false;
}

function validateMark(value: unknown): boolean {
  if (!isPlainObject(value) || typeof value.type !== 'string') return false;
  if (!ALLOWED_MARK_TYPES.has(value.type)) return false;
  return validateAttributes(value.type, value.attrs, true);
}

function validateNode(
  value: unknown,
  state: { count: number; textLength: number },
  depth: number,
): value is ICompanyBrainRichTextNode {
  if (!isPlainObject(value) || typeof value.type !== 'string') return false;
  if (!ALLOWED_NODE_TYPES.has(value.type) || depth > MAX_DEPTH) return false;
  if (
    Object.keys(value).some(
      (key) => !['type', 'attrs', 'text', 'marks', 'content'].includes(key),
    )
  ) {
    return false;
  }

  state.count += 1;
  if (state.count > MAX_DOCUMENT_NODES) return false;
  if (!validateAttributes(value.type, value.attrs, false)) return false;

  if (value.type === 'text') {
    if (typeof value.text !== 'string' || value.content !== undefined)
      return false;
    state.textLength += value.text.length;
    return (
      state.textLength <= MAX_TEXT_LENGTH &&
      (value.marks === undefined ||
        (Array.isArray(value.marks) && value.marks.every(validateMark)))
    );
  }

  if (value.text !== undefined || value.marks !== undefined) return false;
  if (value.content !== undefined && !Array.isArray(value.content))
    return false;
  if (
    [
      'doc',
      'paragraph',
      'heading',
      'blockquote',
      'bulletList',
      'orderedList',
      'listItem',
    ].includes(value.type) &&
    !Array.isArray(value.content)
  ) {
    return false;
  }
  return (
    value.content === undefined ||
    value.content.every((child) => validateNode(child, state, depth + 1))
  );
}

export function isValidCompanyBrainRichTextDocument(
  value: unknown,
): value is ICompanyBrainRichTextNode {
  if (!isPlainObject(value) || value.type !== 'doc') return false;
  try {
    if (JSON.stringify(value).length > MAX_DOCUMENT_LENGTH) return false;
  } catch {
    return false;
  }
  return validateNode(value, { count: 0, textLength: 0 }, 0);
}

@ValidatorConstraint({ name: 'isCompanyBrainRichTextDocument', async: false })
export class IsCompanyBrainRichTextDocument implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isValidCompanyBrainRichTextDocument(value);
  }

  defaultMessage(): string {
    return 'Case study content must be a valid, safe rich-text document.';
  }
}
