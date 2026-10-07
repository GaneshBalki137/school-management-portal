// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { academicYear, average, csvCell, currentSemester, hourLabel, initials, letterGrade, toCsv } from './format.ts';

test('average matches the database rule: mean of filled-in values, one decimal', () => {
  assert.equal(average([80, 90, 70, null]), 80);
  assert.equal(average([55, null, 65, 75]), 65);
  assert.equal(average([1, 2]), 1.5);
  assert.equal(average([10, 10, 11]), 10.3);
  assert.equal(average([null, undefined]), null);
});

test('letter grades', () => {
  assert.deepEqual([95, 90, 85, 72, 60, 50, 49.9, null].map(letterGrade), ['A+', 'A+', 'A', 'B', 'C', 'D', 'F', '—']);
});

test('csv cells are quoted and formulas are defused', () => {
  assert.equal(csvCell('Ravi'), '"Ravi"');
  assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+91 98765 43210'), `"'+91 98765 43210"`);
  assert.equal(csvCell(null), '""');
  assert.equal(toCsv([['a', 1], ['b,c', null]]), '"a","1"\r\n"b,c",""');
});

test('dates and labels', () => {
  assert.equal(hourLabel(9), '9:00 AM');
  assert.equal(hourLabel(12), '12:00 PM');
  assert.equal(hourLabel(14), '2:00 PM');
  assert.equal(currentSemester(new Date(2026, 5, 1)), 1);
  assert.equal(currentSemester(new Date(2026, 11, 1)), 2);
  assert.equal(academicYear(new Date(2026, 9, 8)), '2026–27');
  assert.equal(academicYear(new Date(2027, 2, 1)), '2026–27');
  assert.equal(initials('Ravi  Kumar Singh'), 'RK');
});
