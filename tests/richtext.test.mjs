import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, plainText, renderLightRich } from '../public/js/richtext.js';

test('escapeHtml escapes dangerous HTML characters', () => {
  const input = `<script>alert("xss & 'test'")</script>`;
  const output = escapeHtml(input);
  assert.equal(output, '&lt;script&gt;alert(&quot;xss &amp; &#39;test&#39;&quot;)&lt;/script&gt;');
});

test('plainText returns escaped plain text', () => {
  assert.equal(plainText(`<b>hello</b>`), '&lt;b&gt;hello&lt;/b&gt;');
});

test('renderLightRich converts bold, italic, lists, and linebreaks safely', () => {
  const markdown = `**Header Title**\n*Sub-caption text*\n- Item 1\n- Item 2\nLine 1\nLine 2`;
  const rendered = renderLightRich(markdown);

  assert.ok(rendered.includes('<strong>Header Title</strong>'));
  assert.ok(rendered.includes('<em>Sub-caption text</em>'));
  assert.ok(rendered.includes('<ul><li>Item 1</li><li>Item 2</li></ul>'));
  assert.ok(rendered.includes('Line 1<br>Line 2'));
});

test('renderLightRich neutralizes script injection attempts completely', () => {
  const attack = `**Click me** <img src=x onerror=alert(1)> - <script>alert(2)</script>`;
  const rendered = renderLightRich(attack);

  // Unescaped HTML tags (other than allowed strong/em/ul/li/br) must not exist
  assert.equal(rendered.includes('<script'), false);
  assert.equal(rendered.includes('<img'), false);
  assert.ok(rendered.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(rendered.includes('&lt;script&gt;alert(2)&lt;/script&gt;'));
  assert.ok(rendered.includes('<strong>Click me</strong>'));
});
