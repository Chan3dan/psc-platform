import mongoose from 'mongoose';
import { Exam, Subject, Question, MockTest } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';

async function ensureTextIndexes() {
  await Promise.all([
    Question.collection.createIndex({ question_text: 'text', tags: 'text' }),
    Exam.collection.createIndex({ name: 'text', description: 'text' }),
  ]);
}

type Diff = 'easy' | 'medium' | 'hard';
type BankItem = {
  text: string;
  options: [string, string, string, string];
  correct: number;
  explanation: string;
  difficulty: Diff;
  tags: string[];
  year?: number;
};

function toQuestion(subject_id: any, item: BankItem) {
  return {
    subject_id,
    question_text: item.text,
    options: item.options.map((t, i) => ({ index: i, text: t })),
    correct_answer: item.correct,
    explanation: item.explanation,
    difficulty: item.difficulty,
    tags: item.tags,
    year: item.year,
  };
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  await Exam.deleteOne({ slug: 'computer-operator' });

  const exam = await Exam.create({
    name: 'Computer Operator',
    slug: 'computer-operator',
    description: 'Loksewa Aayog — Computer Operator, First Paper (Objective), syllabus-based chapter-wise bank',
    duration_minutes: 45,
    total_marks: 100,
    total_questions: 50,
    negative_marking: 0.2,
    passing_marks: 40,
    pattern_config: {
      sections: [
        { name: 'General Awareness', questions_count: 10, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Public Management', questions_count: 10, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Computer Fundamental', questions_count: 3, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Operating System', questions_count: 2, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Word Processing', questions_count: 4, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Electronic Spreadsheet', questions_count: 3, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Database Management System', questions_count: 3, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Presentation System', questions_count: 2, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Web Designing and Social Media', questions_count: 2, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Computer Network', questions_count: 2, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Cyber Security', questions_count: 3, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Hardware Maintenance and Troubleshooting', questions_count: 2, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
        { name: 'Relevant Legislations and Institutions', questions_count: 4, marks_per_question: 2, negative_marks_per_wrong: 0.2 },
      ],
      shuffle_questions: true,
      shuffle_options: true,
    },
    is_active: true,
  });

  const subjects = await Subject.insertMany([
    { exam_id: exam._id, name: 'General Awareness', slug: 'general-awareness', weightage_percent: 20, is_active: true },
    { exam_id: exam._id, name: 'Public Management', slug: 'public-management', weightage_percent: 20, is_active: true },
    { exam_id: exam._id, name: 'Computer Fundamental', slug: 'computer-fundamental', weightage_percent: 6, is_active: true },
    { exam_id: exam._id, name: 'Operating System', slug: 'operating-system', weightage_percent: 4, is_active: true },
    { exam_id: exam._id, name: 'Word Processing', slug: 'word-processing', weightage_percent: 8, is_active: true },
    { exam_id: exam._id, name: 'Electronic Spreadsheet', slug: 'electronic-spreadsheet', weightage_percent: 6, is_active: true },
    { exam_id: exam._id, name: 'Database Management System', slug: 'dbms', weightage_percent: 6, is_active: true },
    { exam_id: exam._id, name: 'Presentation System', slug: 'presentation-system', weightage_percent: 4, is_active: true },
    { exam_id: exam._id, name: 'Web Designing and Social Media', slug: 'web-designing-social-media', weightage_percent: 4, is_active: true },
    { exam_id: exam._id, name: 'Computer Network', slug: 'computer-network', weightage_percent: 4, is_active: true },
    { exam_id: exam._id, name: 'Cyber Security', slug: 'cyber-security', weightage_percent: 6, is_active: true },
    { exam_id: exam._id, name: 'Hardware Maintenance and Troubleshooting', slug: 'hardware-maintenance-troubleshooting', weightage_percent: 4, is_active: true },
    { exam_id: exam._id, name: 'Relevant Legislations and Institutions', slug: 'relevant-legislations-institutions', weightage_percent: 8, is_active: true },
  ]);

  const [ga, pm, cf, os, wp, es, db, ps, web, net, cyber, hw, law] = subjects;

  const cfBank: BankItem[] = [
    { text: 'The smallest unit of digital data is:', options: ['Byte', 'Bit', 'Nibble', 'Kilobyte'], correct: 1, explanation: 'Bit (0 or 1) is the smallest unit. In PSC objective questions, byte/nibble are common distractors.', difficulty: 'easy', tags: ['units'], year: 2023 },
    { text: '1 Byte equals:', options: ['4 bits', '8 bits', '16 bits', '1024 bits'], correct: 1, explanation: '1 Byte = 8 bits. Remember this for memory conversion questions.', difficulty: 'easy', tags: ['units'] },
    { text: 'Which one is an output device?', options: ['Scanner', 'Microphone', 'Monitor', 'Keyboard'], correct: 2, explanation: 'Monitor displays processed information, so it is output. Scanner/microphone/keyboard are input devices.', difficulty: 'easy', tags: ['io-devices'] },
    { text: 'RAM is classified as:', options: ['Non-volatile memory', 'Secondary storage', 'Volatile memory', 'Optical memory'], correct: 2, explanation: 'RAM is volatile; data is lost when power is off. This is frequently asked in Loksewa computer sections.', difficulty: 'easy', tags: ['memory'] },
    { text: 'ROM is mainly used to store:', options: ['Temporary user files', 'Firmware / bootstrap program', 'Cache data only', 'Spreadsheet formulas'], correct: 1, explanation: 'ROM keeps firmware such as BIOS/UEFI instructions needed during startup.', difficulty: 'medium', tags: ['memory', 'firmware'] },
    { text: 'Which generation of computer used transistors?', options: ['First', 'Second', 'Third', 'Fourth'], correct: 1, explanation: 'Second generation used transistors; first used vacuum tubes, third used ICs, fourth used microprocessors.', difficulty: 'medium', tags: ['history'] },
    { text: 'CPU component that performs arithmetic and logic operations is:', options: ['CU', 'ALU', 'Register bank', 'Bus'], correct: 1, explanation: 'ALU is responsible for arithmetic (+,-,*,/) and logic (AND/OR/NOT) operations.', difficulty: 'easy', tags: ['cpu'] },
    { text: '1 Terabyte (TB) equals:', options: ['1024 MB', '1024 GB', '1024 KB', '1000 GB exactly in binary'], correct: 1, explanation: 'In binary convention used in exam contexts, 1 TB = 1024 GB.', difficulty: 'easy', tags: ['storage'] },
    { text: 'POST during boot stands for:', options: ['Power On Self Test', 'Program Output System Test', 'Power Operating System Tool', 'Primary Operating Startup Test'], correct: 0, explanation: 'POST checks hardware status before OS loads.', difficulty: 'medium', tags: ['boot'] },
    { text: 'Which one is NOT application software?', options: ['MS Word', 'Adobe Reader', 'Windows 11', 'Excel'], correct: 2, explanation: 'Windows 11 is system software (OS), not application software.', difficulty: 'easy', tags: ['software'] },
    { text: 'Cache memory is used to:', options: ['Store backup data permanently', 'Increase CPU speed by storing frequent data', 'Replace RAM fully', 'Connect to internet'], correct: 1, explanation: 'Cache is very fast small memory that reduces CPU fetch time.', difficulty: 'medium', tags: ['memory', 'performance'] },
    { text: 'Binary equivalent of decimal 10 is:', options: ['1001', '1010', '1100', '1110'], correct: 1, explanation: '10 (decimal) = 1010 (binary). Number conversion appears in fundamentals.', difficulty: 'easy', tags: ['number-system'] },
    { text: 'Which port is commonly used for HDMI cable?', options: ['Video/Audio digital output', 'Network LAN only', 'Printer parallel only', 'Power input only'], correct: 0, explanation: 'HDMI carries digital video and audio, common in modern monitor/projector setups.', difficulty: 'easy', tags: ['ports'] },
    { text: 'A malware that replicates by attaching to files is:', options: ['Firewall', 'Virus', 'Driver', 'Patch'], correct: 1, explanation: 'Virus infects files and replicates. Worm differs by spreading without host file.', difficulty: 'medium', tags: ['security'] },
    { text: 'Backup strategy mainly protects against:', options: ['Only slow internet', 'Data loss due to deletion/failure/ransomware', 'Typing errors only', 'Monitor hardware heat'], correct: 1, explanation: 'Regular backup is essential for data recovery in office operations.', difficulty: 'easy', tags: ['backup'] },
    { text: 'Unicode standard is mainly for:', options: ['Compressing images', 'Representing text of many languages', 'Speeding CPU clocks', 'Formatting disks'], correct: 1, explanation: 'Unicode enables Nepali + English + other scripts in one encoding standard.', difficulty: 'medium', tags: ['encoding', 'nepali-context'] },
    { text: 'Which storage device has no moving mechanical part?', options: ['HDD', 'SSD', 'CD-ROM', 'Floppy disk'], correct: 1, explanation: 'SSD uses flash memory and no spinning disk, giving faster access and better shock resistance.', difficulty: 'easy', tags: ['storage'] },
    { text: 'In office environment, UPS is used to:', options: ['Increase internet speed', 'Provide temporary power backup', 'Replace antivirus', 'Cool CPU fan'], correct: 1, explanation: 'UPS gives short backup and surge protection, important in load-shedding areas.', difficulty: 'easy', tags: ['hardware', 'power'] },
    { text: 'Which is an example of open-source operating system family?', options: ['Linux', 'MS DOS', 'Windows NT only', 'iOS only'], correct: 0, explanation: 'Linux distributions are open-source and widely used in servers and education labs.', difficulty: 'medium', tags: ['os-basics'] },
    { text: 'What does GUI stand for?', options: ['General User Input', 'Graphical User Interface', 'Global Utility Interface', 'Graph Unit Integration'], correct: 1, explanation: 'GUI allows interaction through windows/icons/menus/pointer rather than command text only.', difficulty: 'easy', tags: ['gui'] },
  ];

  const osBank: BankItem[] = [
    { text: 'Which is a multi-user operating system?', options: ['MS-DOS', 'UNIX', 'BASIC', 'Logo'], correct: 1, explanation: 'UNIX supports multiple users and multitasking. DOS is single-user and limited.', difficulty: 'medium', tags: ['os-types'] },
    { text: 'Booting means:', options: ['Formatting hard disk', 'Starting computer and loading OS', 'Installing RAM', 'Deleting temp files'], correct: 1, explanation: 'Booting is OS loading sequence after power-on/restart.', difficulty: 'easy', tags: ['boot'] },
    { text: 'A file system in modern Windows is commonly:', options: ['FAT12 only', 'NTFS', 'EXT4', 'HFS+'], correct: 1, explanation: 'NTFS is default in modern Windows and supports permissions and large files.', difficulty: 'medium', tags: ['filesystem'] },
    { text: 'Ctrl + Alt + Del in Windows is often used to open:', options: ['Command Prompt directly', 'Security options / Task Manager access', 'BIOS setup', 'Recycle Bin'], correct: 1, explanation: 'It opens security screen; from there user can open Task Manager, lock/sign out, etc.', difficulty: 'easy', tags: ['shortcuts'] },
    { text: 'Which command in Windows can show IP configuration?', options: ['dir', 'ipconfig', 'chkdsk', 'format'], correct: 1, explanation: 'ipconfig displays network adapter IP details, useful for troubleshooting office LAN issues.', difficulty: 'medium', tags: ['network-troubleshooting'] },
    { text: 'Process scheduling is a function of:', options: ['Compiler only', 'Operating System', 'BIOS only', 'Spreadsheet software'], correct: 1, explanation: 'CPU scheduling is handled by OS kernel.', difficulty: 'medium', tags: ['os-functions'] },
    { text: 'Safe Mode in Windows is used for:', options: ['Gaming performance boost', 'Troubleshooting startup/system issues', 'Permanent faster boot', 'Database indexing'], correct: 1, explanation: 'Safe Mode loads minimal drivers/services for diagnosis and repair.', difficulty: 'easy', tags: ['troubleshooting'] },
    { text: 'Which is not an operating system?', options: ['Ubuntu', 'Windows', 'Oracle', 'macOS'], correct: 2, explanation: 'Oracle is a company/database product line, not a desktop OS name here.', difficulty: 'easy', tags: ['os-identification'] },
    { text: 'A device driver is software that:', options: ['Edits photos', 'Enables OS to communicate with hardware', 'Converts PDF to Word', 'Creates database tables'], correct: 1, explanation: 'Drivers act as translators between OS and hardware devices.', difficulty: 'easy', tags: ['drivers'] },
    { text: 'Virtual memory uses:', options: ['Only CPU register', 'Part of disk as extension of RAM', 'Only cache memory', 'Only optical drive'], correct: 1, explanation: 'Paging/swap uses disk space when RAM is insufficient.', difficulty: 'medium', tags: ['memory-management'] },
    { text: 'Linux command to list files in a directory is:', options: ['list', 'show', 'ls', 'dir /w only'], correct: 2, explanation: 'Basic Linux file listing command is ls.', difficulty: 'easy', tags: ['linux-basic'] },
    { text: 'User account permission model in OS helps to:', options: ['Increase monitor brightness', 'Control access and security', 'Fix printer ink issue', 'Run slideshows'], correct: 1, explanation: 'Roles/permissions protect data and system resources from unauthorized use.', difficulty: 'medium', tags: ['security'] },
  ];

  const wpBank: BankItem[] = [
    { text: 'Shortcut for bold in MS Word is:', options: ['Ctrl+I', 'Ctrl+B', 'Ctrl+U', 'Ctrl+E'], correct: 1, explanation: 'Ctrl+B = Bold, one of the most common office shortcuts.', difficulty: 'easy', tags: ['word-shortcuts'] },
    { text: 'Default extension of modern Word document is:', options: ['.doc', '.docx', '.txt', '.rtf'], correct: 1, explanation: '.docx is default format in Word 2007+.', difficulty: 'easy', tags: ['word-format'] },
    { text: 'Ctrl+H in Word opens:', options: ['Header', 'Find and Replace', 'Hyperlink dialog', 'Help menu'], correct: 1, explanation: 'Ctrl+H opens Replace dialog, useful for bulk corrections in official letters.', difficulty: 'easy', tags: ['word-shortcuts'] },
    { text: 'Mail Merge is used to:', options: ['Create slides', 'Send personalized letters to many recipients', 'Compress files', 'Create database relations'], correct: 1, explanation: 'Mail Merge combines template + data source for mass personalized documents.', difficulty: 'medium', tags: ['mail-merge'] },
    { text: 'Which alignment is commonly used for official letter body?', options: ['Center', 'Justify', 'Right only', 'Vertical'], correct: 1, explanation: 'Justify gives clean left-right margins, common in formal documentation.', difficulty: 'easy', tags: ['formatting'] },
    { text: 'A Word style helps to:', options: ['Change printer cartridge', 'Apply consistent formatting quickly', 'Connect to Wi-Fi', 'Encrypt hard disk'], correct: 1, explanation: 'Styles ensure standardized headings/body text across documents.', difficulty: 'medium', tags: ['styles'] },
    { text: 'Ctrl+Enter in Word inserts:', options: ['Line break', 'Section break', 'Page break', 'Column break'], correct: 2, explanation: 'Ctrl+Enter inserts page break and starts new page immediately.', difficulty: 'easy', tags: ['word-shortcuts'] },
    { text: 'Track Changes feature is useful for:', options: ['Creating pivot table', 'Reviewing and auditing edits', 'Changing OS theme', 'Testing keyboard'], correct: 1, explanation: 'Track Changes records insertions/deletions/comments for review workflow.', difficulty: 'medium', tags: ['review'] },
    { text: 'Header and Footer are used to place:', options: ['Only images', 'Recurring top/bottom content on each page', 'Database records', 'Audio clips'], correct: 1, explanation: 'They contain repeated info like page number, office name, date.', difficulty: 'easy', tags: ['layout'] },
    { text: 'Inserting table of contents in Word requires:', options: ['Manual typing only', 'Proper heading styles', 'Internet connection mandatory', 'Macros always'], correct: 1, explanation: 'Auto TOC relies on Heading styles (Heading 1/2/3).', difficulty: 'medium', tags: ['toc'] },
    { text: 'Ctrl+K is shortcut for:', options: ['Insert comment', 'Insert hyperlink', 'Insert bookmark', 'Spell check'], correct: 1, explanation: 'Ctrl+K opens hyperlink dialog.', difficulty: 'easy', tags: ['word-shortcuts'] },
    { text: 'Spell and Grammar check shortcut key is commonly:', options: ['F7', 'F2', 'F5', 'F12'], correct: 0, explanation: 'F7 runs spelling and grammar check in Word.', difficulty: 'easy', tags: ['proofing'] },
    { text: 'What does "Justification" in paragraph formatting do?', options: ['Adds watermark', 'Aligns text evenly to both margins', 'Creates table', 'Rotates page'], correct: 1, explanation: 'Justify aligns text to both left and right margins for neat blocks.', difficulty: 'easy', tags: ['formatting'] },
    { text: 'Word count tool is mainly used to:', options: ['Count pages only', 'Count characters/words for formal limits', 'Translate text', 'Encrypt document'], correct: 1, explanation: 'Useful in notice, report, exam answers, and limited-word submissions.', difficulty: 'easy', tags: ['proofing'] },
    { text: 'Which format is best for non-editable document sharing?', options: ['.docx', '.txt', '.pdf', '.csv'], correct: 2, explanation: 'PDF preserves layout and reduces accidental editing.', difficulty: 'easy', tags: ['document-sharing'] },
    { text: 'Find and Replace can be used to:', options: ['Change repeated typo globally', 'Install drivers', 'Format USB', 'Create charts'], correct: 0, explanation: 'Ideal for replacing repeated mistakes like office name changes.', difficulty: 'easy', tags: ['editing'] },
    { text: 'What is the purpose of indentation?', options: ['Increase CPU speed', 'Control paragraph start/spacing positions', 'Change monitor resolution', 'Delete hidden text'], correct: 1, explanation: 'Indentation controls left/right offsets, improving document readability.', difficulty: 'medium', tags: ['paragraph'] },
    { text: 'In Nepali typing workflow, Unicode fonts are preferred because they:', options: ['Work only offline', 'Are standard, searchable, and shareable', 'Need no keyboard layout', 'Cannot print'], correct: 1, explanation: 'Unicode Nepali text is portable across systems and suitable for e-governance records.', difficulty: 'medium', tags: ['unicode', 'nepali-context'] },
  ];

  const esBank: BankItem[] = [
    { text: 'Which symbol starts a formula in Excel?', options: ['#', '=', '@', '&'], correct: 1, explanation: 'Excel formulas begin with = sign.', difficulty: 'easy', tags: ['excel-basic'] },
    { text: 'Function used to calculate average is:', options: ['SUM()', 'AVG()', 'AVERAGE()', 'MEAN()'], correct: 2, explanation: 'AVERAGE() is the correct built-in function.', difficulty: 'easy', tags: ['excel-functions'] },
    { text: 'COUNT() function counts:', options: ['All non-empty cells', 'Only numeric cells', 'Only blank cells', 'Only text cells'], correct: 1, explanation: 'COUNT counts numeric values only; COUNTA counts non-empty cells.', difficulty: 'medium', tags: ['excel-functions'] },
    { text: 'Absolute cell reference in Excel is written as:', options: ['A1', '$A$1', 'A$1$', '#A1'], correct: 1, explanation: '$A$1 locks both row and column references.', difficulty: 'easy', tags: ['cell-reference'] },
    { text: 'Which chart is best for part-to-whole percentage?', options: ['Line chart', 'Pie chart', 'Scatter chart', 'Surface chart'], correct: 1, explanation: 'Pie chart is commonly used for proportional distribution.', difficulty: 'easy', tags: ['charts'] },
    { text: 'AutoFill in Excel is used to:', options: ['Encrypt workbook', 'Extend series/pattern quickly', 'Create macros automatically', 'Import SQL table'], correct: 1, explanation: 'AutoFill helps copy formulas or generate sequences like 1,2,3.', difficulty: 'easy', tags: ['productivity'] },
    { text: 'Shortcut to edit active cell is:', options: ['F2', 'F4', 'F7', 'F11'], correct: 0, explanation: 'F2 enters edit mode for active cell.', difficulty: 'easy', tags: ['excel-shortcuts'] },
    { text: 'VLOOKUP is used to:', options: ['Vertical formatting', 'Search value in first column and return match', 'Create pivot chart', 'Validate data type only'], correct: 1, explanation: 'VLOOKUP finds key in first column of range and returns corresponding column value.', difficulty: 'medium', tags: ['lookup'] },
    { text: 'What does IF function do?', options: ['Adds rows', 'Performs logical test with true/false outputs', 'Sorts alphabetically only', 'Creates worksheet'], correct: 1, explanation: 'IF(condition, true_result, false_result) handles decision logic.', difficulty: 'medium', tags: ['logical-functions'] },
    { text: 'Data validation helps to:', options: ['Restrict wrong input values', 'Increase CPU cache', 'Reduce monitor brightness', 'Export to PDF directly'], correct: 0, explanation: 'Validation avoids entry errors in forms, attendance, stock registers.', difficulty: 'medium', tags: ['data-quality'] },
    { text: 'Pivot Table is mainly for:', options: ['Drawing diagrams', 'Summarizing and analyzing large data', 'Typing letters', 'OS update'], correct: 1, explanation: 'Pivot tables quickly summarize totals, counts, and grouped insights.', difficulty: 'medium', tags: ['pivot'] },
    { text: 'Which function returns current date?', options: ['DATE()', 'TODAY()', 'NOWDATE()', 'CURDATE()'], correct: 1, explanation: 'TODAY() returns current date from system clock.', difficulty: 'easy', tags: ['date-time'] },
    { text: 'Conditional formatting is used to:', options: ['Insert comments', 'Highlight cells based on rules', 'Lock workbook always', 'Convert formula to values only'], correct: 1, explanation: 'It visually marks data like low stock, absent days, overdue items.', difficulty: 'easy', tags: ['formatting'] },
    { text: 'Freeze Panes in Excel is useful when:', options: ['Deleting hidden rows', 'Keeping headers visible during scrolling', 'Protecting workbook password', 'Compressing file size'], correct: 1, explanation: 'Freeze Panes keeps top row/columns fixed for large sheets.', difficulty: 'easy', tags: ['usability'] },
    { text: 'Which shortcut inserts sum quickly for selected range?', options: ['Alt+=', 'Ctrl+=', 'Shift+=', 'F9'], correct: 0, explanation: 'Alt+= inserts AutoSum formula quickly.', difficulty: 'easy', tags: ['excel-shortcuts'] },
    { text: 'A workbook contains:', options: ['Only one chart', 'One or more worksheets', 'Only one formula', 'Only text data'], correct: 1, explanation: 'Workbook is the Excel file; it can hold multiple worksheets.', difficulty: 'easy', tags: ['excel-basic'] },
    { text: 'To sort data by marks descending, you should use:', options: ['A to Z', 'Z to A / Largest to Smallest', 'Filter by color only', 'Merge cells'], correct: 1, explanation: 'Descending sort helps rank from highest to lowest score.', difficulty: 'easy', tags: ['sorting'] },
    { text: 'In Nepali office reporting, why is CSV export useful?', options: ['Only for images', 'For data exchange with MIS/online portals', 'For font embedding', 'For slide animation'], correct: 1, explanation: 'CSV is widely accepted in digital systems for bulk upload/import.', difficulty: 'medium', tags: ['data-export', 'nepali-context'] },
  ];

  const dbBank: BankItem[] = [
    { text: 'DBMS stands for:', options: ['Data Backup Management Service', 'Database Management System', 'Digital Binary Mapping System', 'Data Bus Memory Structure'], correct: 1, explanation: 'DBMS is software to store, manage, and retrieve structured data.', difficulty: 'easy', tags: ['dbms-basic'] },
    { text: 'A table row is also called:', options: ['Field', 'Record', 'Attribute', 'Schema'], correct: 1, explanation: 'Row = Record; Column = Field/Attribute.', difficulty: 'easy', tags: ['dbms-terms'] },
    { text: 'Primary key in a table should be:', options: ['Duplicate and null', 'Unique and non-null', 'Text only', 'Optional always'], correct: 1, explanation: 'Primary key uniquely identifies each record and cannot be null.', difficulty: 'easy', tags: ['keys'] },
    { text: 'Which SQL command is used to retrieve data?', options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], correct: 2, explanation: 'SELECT retrieves rows based on criteria.', difficulty: 'easy', tags: ['sql'] },
    { text: 'Foreign key is used to:', options: ['Format table color', 'Create relation between two tables', 'Encrypt database', 'Backup database'], correct: 1, explanation: 'Foreign key references primary key in related table to ensure integrity.', difficulty: 'medium', tags: ['relations'] },
    { text: 'Normalization in DBMS helps to:', options: ['Increase redundancy', 'Reduce redundancy and improve integrity', 'Delete all null values only', 'Convert database to chart'], correct: 1, explanation: 'Normalization organizes tables to minimize duplicate/inconsistent data.', difficulty: 'medium', tags: ['normalization'] },
    { text: 'MS Access object for user-friendly data entry is:', options: ['Table only', 'Form', 'Macro only', 'Report only'], correct: 1, explanation: 'Forms provide controlled input interface in Access.', difficulty: 'easy', tags: ['ms-access'] },
    { text: 'Which SQL clause filters rows after SELECT?', options: ['GROUP BY', 'WHERE', 'ORDER BY', 'HAVING always first'], correct: 1, explanation: 'WHERE applies row-level conditions before grouping.', difficulty: 'easy', tags: ['sql'] },
    { text: 'Database backup is important for:', options: ['Only increasing speed', 'Recovery after crash/corruption', 'Color theme update', 'Adding formulas'], correct: 1, explanation: 'Backup enables restoration after failure or accidental deletion.', difficulty: 'easy', tags: ['backup'] },
    { text: 'One-to-many relationship means:', options: ['One record relates to many in another table', 'Many tables merge to one column', 'Only one table exists', 'Two primary keys in one row'], correct: 0, explanation: 'Example: one department can have many employees.', difficulty: 'medium', tags: ['relations'] },
    { text: 'DDL in SQL includes:', options: ['SELECT and UPDATE', 'CREATE, ALTER, DROP', 'COMMIT and ROLLBACK only', 'GRANT and REVOKE only'], correct: 1, explanation: 'DDL manipulates structure/schema of database objects.', difficulty: 'medium', tags: ['sql-groups'] },
    { text: 'For Nepal local-level citizen record system, unique ID field should be:', options: ['Nullable text note', 'Primary key with strict uniqueness', 'Random duplicate value', 'Image type only'], correct: 1, explanation: 'Government record systems require unique identifiers for reliable data linkage.', difficulty: 'medium', tags: ['nepali-context', 'keys'] },
  ];

  const psBank: BankItem[] = [
    { text: 'Default extension of PowerPoint file is:', options: ['.ppt', '.pptx', '.ppsx', '.docx'], correct: 1, explanation: 'Modern PowerPoint default is .pptx.', difficulty: 'easy', tags: ['ppt'] },
    { text: 'Slide Sorter view is used to:', options: ['Edit detailed text only', 'Rearrange slides quickly', 'Print only notes', 'Insert formulas'], correct: 1, explanation: 'Slide Sorter shows thumbnails to reorder slides.', difficulty: 'easy', tags: ['ppt-view'] },
    { text: 'Shortcut key to start slideshow from beginning is:', options: ['F5', 'Shift+F5', 'Ctrl+F5', 'F7'], correct: 0, explanation: 'F5 starts from first slide; Shift+F5 from current slide.', difficulty: 'easy', tags: ['ppt-shortcuts'] },
    { text: 'Transition in PowerPoint applies to:', options: ['Text within one shape', 'Movement between slides', 'Database relation', 'Workbook sheets'], correct: 1, explanation: 'Transition effects happen when moving from one slide to another.', difficulty: 'easy', tags: ['transitions'] },
    { text: 'Animation in PowerPoint applies to:', options: ['Slide-to-slide effect only', 'Objects within a slide', 'Printer settings', 'Header/footer only'], correct: 1, explanation: 'Animations control object entry/emphasis/exit on a slide.', difficulty: 'easy', tags: ['animations'] },
    { text: 'Presenter View helps presenter to:', options: ['Hide all slides', 'See notes/timer while audience sees slide', 'Edit SQL query', 'Upload website'], correct: 1, explanation: 'Presenter View supports confident delivery in training/briefings.', difficulty: 'medium', tags: ['presentation-skill'] },
    { text: 'Best practice for official briefing slide text is:', options: ['Very long paragraphs', 'Short bullet points with key data', 'Only decorative images', 'No title on slide'], correct: 1, explanation: 'Concise bullets improve clarity for administrative presentation contexts.', difficulty: 'medium', tags: ['best-practice'] },
    { text: 'Master Slide is used to:', options: ['Delete all slides', 'Apply consistent design/layout to all slides', 'Lock laptop keyboard', 'Insert database table'], correct: 1, explanation: 'Slide Master controls global theme, fonts, placeholders.', difficulty: 'medium', tags: ['slide-master'] },
    { text: 'Which format is suitable for slideshow-only mode?', options: ['.pptx', '.ppsx', '.xlsx', '.csv'], correct: 1, explanation: '.ppsx opens directly as slideshow.', difficulty: 'medium', tags: ['file-format'] },
    { text: 'In training sessions of government offices, charts in slides are used to:', options: ['Decorate randomly', 'Present trends and comparisons clearly', 'Replace attendance register', 'Configure OS services'], correct: 1, explanation: 'Charts make policy/service data easier to understand in briefings.', difficulty: 'easy', tags: ['nepali-context', 'data-communication'] },
  ];

  const webBank: BankItem[] = [
    { text: 'HTML stands for:', options: ['Hyper Text Markup Language', 'High Transfer Machine Language', 'Hyper Tool Multi Language', 'Home Text Markup Link'], correct: 0, explanation: 'HTML is the standard markup language for webpage structure.', difficulty: 'easy', tags: ['html'] },
    { text: 'Tag used for creating hyperlink is:', options: ['<img>', '<a>', '<linker>', '<href>'], correct: 1, explanation: '<a href=\"...\"> creates a clickable link.', difficulty: 'easy', tags: ['html'] },
    { text: 'CSS is primarily used for:', options: ['Database queries', 'Styling and layout of web pages', 'Audio editing', 'Server reboot'], correct: 1, explanation: 'CSS controls color, spacing, fonts, and responsive layout.', difficulty: 'easy', tags: ['css'] },
    { text: 'Which protocol secures web communication?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correct: 2, explanation: 'HTTPS uses TLS encryption for secure browser-server communication.', difficulty: 'easy', tags: ['web-security'] },
    { text: 'A domain name example is:', options: ['192.168.1.1', 'www.nepal.gov.np', 'C:\\\\Windows', 'index.html only'], correct: 1, explanation: 'Domain names map to IP addresses and are human-readable web identifiers.', difficulty: 'easy', tags: ['domain'] },
    { text: 'What does URL represent?', options: ['Uniform Resource Locator', 'Universal Record Link', 'User Resource List', 'Uniform Router Link'], correct: 0, explanation: 'URL is the address used to locate a resource on the web.', difficulty: 'easy', tags: ['url'] },
    { text: 'Tag for inserting image in HTML is:', options: ['<picture>', '<img>', '<image>', '<src>'], correct: 1, explanation: '<img src=\"...\" alt=\"...\"> is standard image element.', difficulty: 'easy', tags: ['html'] },
    { text: 'Which is a client-side scripting language?', options: ['SQL', 'JavaScript', 'MongoDB', 'PostgreSQL'], correct: 1, explanation: 'JavaScript runs in browser and adds interaction to web pages.', difficulty: 'easy', tags: ['javascript'] },
    { text: 'Responsive web design means:', options: ['Site works only on desktop', 'Layout adapts to different screen sizes', 'Site has only one fixed width', 'Requires no CSS'], correct: 1, explanation: 'Responsive pages support mobile/tablet/desktop usability.', difficulty: 'medium', tags: ['responsive'] },
    { text: 'For citizen-service information pages in Nepal, key accessibility practice is:', options: ['Low contrast text only', 'Clear headings, alt text, readable fonts', 'Disable keyboard navigation', 'Use image-only content'], correct: 1, explanation: 'Accessible design improves reach for diverse users in e-governance portals.', difficulty: 'medium', tags: ['nepali-context', 'accessibility'] },
  ];

  const gaBank: BankItem[] = [
    { text: 'नेपालको संविधान २०७२ अनुसार संघीय संसद कति सदनात्मक छ?', options: ['एक सदनात्मक', 'दुई सदनात्मक', 'तीन सदनात्मक', 'चार सदनात्मक'], correct: 1, explanation: 'संघीय संसद प्रतिनिधि सभा र राष्ट्रिय सभा गरी दुई सदनात्मक छ।', difficulty: 'easy', tags: ['constitution'] },
    { text: 'संयुक्त राष्ट्रसंघको स्थापना कहिले भएको हो?', options: ['1943', '1945', '1948', '1950'], correct: 1, explanation: 'UN को स्थापना 1945 मा भएको हो।', difficulty: 'easy', tags: ['international'] },
    { text: 'SAARC को मुख्यालय कहाँ छ?', options: ['ढाका', 'काठमाडौँ', 'इस्लामाबाद', 'नयाँ दिल्ली'], correct: 1, explanation: 'SAARC सचिवालय काठमाडौँमा रहेको छ।', difficulty: 'easy', tags: ['regional-org'] },
    { text: 'नेपालमा प्रदेश संख्या कति छ?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'नेपालमा ७ प्रदेश छन्।', difficulty: 'easy', tags: ['federalism'] },
    { text: 'नेपालको समय UTC भन्दा कति अगाडि छ?', options: ['+5:00', '+5:30', '+5:45', '+6:00'], correct: 2, explanation: 'नेपाल समय UTC+5:45 हो।', difficulty: 'easy', tags: ['timezone'] },
    { text: 'विश्व वातावरण दिवस कहिले मनाइन्छ?', options: ['जुन 1', 'जुन 5', 'जुन 8', 'जुन 15'], correct: 1, explanation: 'विश्व वातावरण दिवस जुन ५ मा मनाइन्छ।', difficulty: 'easy', tags: ['important-days'] },
    { text: 'नेपालको राष्ट्रिय जनगणना सामान्यतया कति वर्षमा हुन्छ?', options: ['5', '8', '10', '12'], correct: 2, explanation: 'राष्ट्रिय जनगणना प्रायः १० वर्षको अन्तरमा हुन्छ।', difficulty: 'medium', tags: ['population'] },
    { text: 'लोकसेवा आयोग कुन प्रकारको निकाय हो?', options: ['न्यायिक निकाय', 'संवैधानिक निकाय', 'वित्तीय निकाय', 'अस्थायी समिति'], correct: 1, explanation: 'लोक सेवा आयोग संवैधानिक निकाय हो।', difficulty: 'easy', tags: ['constitutional-body'] },
    { text: 'बिम्स्टेक (BIMSTEC) कुन क्षेत्रसँग सम्बन्धित संस्था हो?', options: ['युरोप', 'दक्षिणपूर्व एसिया मात्र', 'बे अफ बंगाल क्षेत्र', 'मध्यपूर्व'], correct: 2, explanation: 'BIMSTEC बे अफ बंगाल क्षेत्रीय सहकार्यसँग सम्बन्धित छ।', difficulty: 'medium', tags: ['regional-org'] },
    { text: 'नेपालको संविधानका अनुसूचीहरू सामान्यतया केका लागि प्रयोग हुन्छन्?', options: ['कानुन रद्द गर्न', 'विवरण/सूचीगत व्यवस्था उल्लेख गर्न', 'निर्वाचन मिति तय गर्न', 'अदालत गठन गर्न'], correct: 1, explanation: 'अनुसूचीमा सूचीगत तथा प्राविधिक विवरणहरू राखिन्छन्।', difficulty: 'medium', tags: ['constitution'] },
  ];

  const pmBank: BankItem[] = [
    { text: 'Office Management को मुख्य उद्देश्य के हो?', options: ['भवन सजावट मात्र', 'कार्यालय स्रोतको प्रभावकारी उपयोग', 'सिर्फ फाइल भण्डारण', 'कर्मचारी घटाउनु'], correct: 1, explanation: 'कार्यालय व्यवस्थापनले स्रोत, समय र प्रक्रिया प्रभावकारी बनाउँछ।', difficulty: 'easy', tags: ['office-management'] },
    { text: 'Registration & Dispatch प्रणालीको उद्देश्य के हो?', options: ['फाइल मेटाउन', 'आगमन/प्रेषण पत्रको व्यवस्थित अभिलेख', 'इमेल बन्द गर्न', 'टाइपिङ परीक्षण'], correct: 1, explanation: 'दर्ता-चलानीले पत्राचार ट्र्याकिङ र उत्तरदायित्व सुनिश्चित गर्छ।', difficulty: 'easy', tags: ['office-procedure'] },
    { text: 'Filing प्रणाली किन आवश्यक हुन्छ?', options: ['जग्गा मापन गर्न', 'कागजात सजिलै खोज्न/सुरक्षित राख्न', 'इन्टरनेट बढाउन', 'केवल पुराना पत्र नष्ट गर्न'], correct: 1, explanation: 'सुचारु फाइलिङले अभिलेख उपलब्धता र पारदर्शिता बढाउँछ।', difficulty: 'easy', tags: ['record-management'] },
    { text: 'Public Charter को मुख्य उद्देश्य के हो?', options: ['सेवा अवधि, मापदण्ड र उत्तरदायित्व स्पष्ट गर्नु', 'कर बढाउनु', 'कर्मचारी भर्ती रोक्नु', 'फाइल गोप्य राख्नु'], correct: 0, explanation: 'नागरिकलाई सेवा प्रक्रिया, समय, शुल्क र गुनासो माध्यम स्पष्ट पार्नु Public Charter को उद्देश्य हो।', difficulty: 'medium', tags: ['public-charter'] },
    { text: 'Good Governance मा पारदर्शिता भन्नाले के बुझिन्छ?', options: ['सूचना लुकाउने', 'निर्णय प्रक्रिया खुला र जवाफदेही बनाउने', 'केवल आन्तरिक बैठक', 'मौखिक आदेश मात्र'], correct: 1, explanation: 'पारदर्शिताले निर्णय र सेवा प्रवाहमा विश्वास बढाउँछ।', difficulty: 'easy', tags: ['good-governance'] },
    { text: 'Right to Information (RTI) को मूल भावना के हो?', options: ['सूचना रोक्ने', 'नागरिकलाई सार्वजनिक सूचना पहुँच दिनु', 'मिडिया नियन्त्रण', 'कर्मचारी मात्रलाई सूचना'], correct: 1, explanation: 'सूचनाको हकले नागरिकलाई सार्वजनिक निकायको जानकारी माग्ने अधिकार दिन्छ।', difficulty: 'medium', tags: ['rti'] },
    { text: 'Office correspondence मा subject line किन महत्त्वपूर्ण हुन्छ?', options: ['सुन्दर देखाउन', 'पत्रको मुख्य विषय चाँडो बुझाउन', 'फाइल नम्बर हटाउन', 'हस्ताक्षर बदल्न'], correct: 1, explanation: 'स्पष्ट subject ले पत्र वर्गीकरण र निर्णय प्रक्रियालाई छिटो बनाउँछ।', difficulty: 'easy', tags: ['correspondence'] },
    { text: 'Human Values in public service emphasizes:', options: ['केवल नियम', 'इमानदारी, निष्पक्षता र नागरिक सम्मान', 'राजनीतिक पक्षपात', 'गोपनीयता उल्लंघन'], correct: 1, explanation: 'सार्वजनिक सेवामा नैतिकता र नागरिक मैत्री व्यवहार अनिवार्य हुन्छ।', difficulty: 'easy', tags: ['human-values'] },
    { text: 'Budget execution मा office assistant को एक व्यावहारिक भूमिका के हुन सक्छ?', options: ['नीति बनाउने', 'वित्तीय कागजात व्यवस्थित राख्ने र समन्वय गर्ने', 'अदालत फैसला गर्ने', 'कर निर्धारण गर्ने'], correct: 1, explanation: 'कार्यालय सहयोगीले कागजी प्रक्रिया र अभिलेख व्यवस्थापनमा प्रमुख सहयोग गर्छ।', difficulty: 'medium', tags: ['public-finance'] },
    { text: 'Decision-making in public management should be based on:', options: ['व्यक्तिगत लाभ', 'तथ्य, नियम र सार्वजनिक हित', 'अफवाह', 'ढिलाइ मात्र'], correct: 1, explanation: 'सार्वजनिक व्यवस्थापनमा नियम, प्रमाण र जनहितका आधारमा निर्णय हुनुपर्छ।', difficulty: 'easy', tags: ['decision-making'] },
  ];

  const netBank: BankItem[] = [
    { text: 'What is the full form of LAN?', options: ['Local Area Network', 'Large Access Node', 'Linked Area Node', 'Local Access Number'], correct: 0, explanation: 'LAN is a network that covers a limited geographical area such as an office, lab, or building.', difficulty: 'easy', tags: ['network-basics'] },
    { text: 'What is the primary function of a router?', options: ['Printing documents', 'Routing packets between different networks', 'Renaming files', 'Charging batteries'], correct: 1, explanation: 'A router forwards data packets between networks using IP addressing and routing logic.', difficulty: 'easy', tags: ['devices'] },
    { text: 'RJ45 connector is mainly used with:', options: ['LAN cable', 'Power cable', 'HDMI cable', 'VGA cable'], correct: 0, explanation: 'RJ45 is the standard connector used for Ethernet/LAN cables.', difficulty: 'easy', tags: ['connectivity'] },
    { text: 'What is the purpose of the PING utility?', options: ['Remove viruses', 'Test host reachability', 'Create database backup', 'Calibrate printer'], correct: 1, explanation: 'PING checks whether a target host is reachable and helps measure basic network response.', difficulty: 'medium', tags: ['network-utilities'] },
    { text: 'The `ipconfig` command is commonly used on:', options: ['Windows', 'MS Word', 'Web browser only', 'Printer firmware'], correct: 0, explanation: '`ipconfig` is a Windows command-line tool used to view IP configuration details.', difficulty: 'easy', tags: ['network-utilities'] },
    { text: 'What is the main role of DNS?', options: ['Compress images', 'Resolve domain names to IP addresses', 'Format USB drive', 'Upgrade RAM'], correct: 1, explanation: 'DNS translates human-friendly domain names into machine-friendly IP addresses.', difficulty: 'medium', tags: ['dns'] },
    { text: 'What does static IP address mean?', options: ['Frequently changing IP', 'Manually configured fixed IP', 'Wi-Fi only IP', 'USB device IP'], correct: 1, explanation: 'A static IP remains fixed unless changed manually, unlike dynamic IP assigned by DHCP.', difficulty: 'medium', tags: ['ip-addressing'] },
    { text: 'What is an intranet?', options: ['Public global internet', 'Private internal organizational network', 'Email-only system', 'Cloud storage only'], correct: 1, explanation: 'Intranet is a private network used within an organization with controlled access.', difficulty: 'easy', tags: ['internet-concepts'] },
  ];

  const cyberBank: BankItem[] = [
    { text: 'How does a phishing attack usually occur?', options: ['Hardware overheating', 'Stealing sensitive data through fake email/link', 'RAM upgrade failure', 'Printer paper jam'], correct: 1, explanation: 'Phishing tricks users into revealing credentials or OTPs via fake messages or websites.', difficulty: 'easy', tags: ['threats'] },
    { text: 'Which is a strong password example?', options: ['12345678', 'password', 'Np@2026!Lok', 'qwerty'], correct: 2, explanation: 'A strong password combines uppercase/lowercase letters, numbers, and special symbols.', difficulty: 'easy', tags: ['password'] },
    { text: 'What is the key benefit of Two-Factor Authentication (2FA)?', options: ['Reduces file size', 'Adds an extra layer of login security', 'Increases RAM', 'Improves screen resolution'], correct: 1, explanation: '2FA requires a second verification factor, reducing account takeover risk.', difficulty: 'easy', tags: ['auth'] },
    { text: 'What is the main purpose of a firewall?', options: ['Install fonts', 'Filter/block unauthorized network traffic', 'Increase typing speed', 'Save printer ink'], correct: 1, explanation: 'A firewall enforces security rules on incoming and outgoing network traffic.', difficulty: 'medium', tags: ['firewall'] },
    { text: 'What is the role of antivirus software?', options: ['Detect/remove malware and provide protection', 'Design database relationships', 'Add slide transitions', 'Test LAN cable'], correct: 0, explanation: 'Antivirus tools detect, quarantine, and remove malicious software.', difficulty: 'easy', tags: ['antivirus'] },
    { text: 'What is social engineering in cybersecurity?', options: ['Designing network topology', 'Manipulating people to obtain sensitive information', 'Hardware assembly', 'Spreadsheet sorting'], correct: 1, explanation: 'Social engineering exploits human trust rather than technical vulnerabilities.', difficulty: 'medium', tags: ['social-engineering'] },
  ];

  const hwBank: BankItem[] = [
    { text: 'Why is BIOS/UEFI setup typically used?', options: ['To send emails', 'To configure boot order and hardware settings', 'To create tables', 'To clear browser history'], correct: 1, explanation: 'BIOS/UEFI is used to configure startup device priority and low-level hardware settings.', difficulty: 'medium', tags: ['bios'] },
    { text: 'If keyboard is not working, what should be checked first?', options: ['Reinstall operating system immediately', 'Cable/USB connection and lock indicators', 'Replace hard disk', 'Replace monitor'], correct: 1, explanation: 'First troubleshooting step is to verify physical connection and basic indicators.', difficulty: 'easy', tags: ['troubleshooting'] },
    { text: 'Among RJ45, BNC, and HDMI, HDMI is mainly used for:', options: ['Networking only', 'Digital audio/video display', 'Power backup', 'Mouse input'], correct: 1, explanation: 'HDMI is used to connect display devices such as monitors and projectors.', difficulty: 'easy', tags: ['connectors'] },
    { text: 'System Restore in Windows is used to:', options: ['Delete all personal files', 'Revert system state to an earlier restore point', 'Physically increase RAM', 'Install printer cartridge'], correct: 1, explanation: 'System Restore helps recover from recent software/configuration issues.', difficulty: 'medium', tags: ['windows-tools'] },
    { text: 'What is a major benefit of UPS?', options: ['Change typing font', 'Protection from sudden power loss/fluctuation', 'Increase internet package', 'Increase CPU cores'], correct: 1, explanation: 'UPS provides short-term backup power and voltage protection.', difficulty: 'easy', tags: ['ups'] },
    { text: 'If a device driver is not installed, what is a common effect?', options: ['Monitor shows only blue color', 'Hardware may not be detected/operate properly', 'Excel formula error', 'Email bounce'], correct: 1, explanation: 'Without proper drivers, operating system cannot communicate correctly with hardware.', difficulty: 'easy', tags: ['drivers'] },
  ];

  const lawBank: BankItem[] = [
    { text: 'In Nepal, Electronic Transaction Act belongs to which year (B.S.)?', options: ['2059', '2061', '2063', '2068'], correct: 2, explanation: 'Electronic Transaction Act, 2063 is a core legal framework for digital transactions and cyber matters.', difficulty: 'medium', tags: ['legislation'] },
    { text: 'What does ICT Policy 2072 mainly promote?', options: ['Paper-only workflow', 'Digital transformation and wider ICT adoption', 'Private email only', 'Manual filing only'], correct: 1, explanation: 'ICT Policy 2072 guides expansion of ICT usage in governance and service delivery.', difficulty: 'medium', tags: ['policy'] },
    { text: 'What is the key objective of Government Website Development and Management Directive 2078?', options: ['Build gaming websites', 'Standardize, secure, and improve government websites', 'Stop social media usage', 'Only manage printers'], correct: 1, explanation: 'The directive defines standards and responsibilities for official government websites.', difficulty: 'medium', tags: ['gov-web'] },
    { text: 'DoIT (Department of Information Technology) is mainly related to:', options: ['Agricultural production', 'IT implementation and technical coordination', 'Forest management', 'Judicial decisions'], correct: 1, explanation: 'DoIT supports implementation and coordination of information technology services and systems.', difficulty: 'easy', tags: ['institutions'] },
  ];

  const allQuestions = [
    ...gaBank.slice(0, 10).map((q) => toQuestion(ga._id, q)),
    ...pmBank.slice(0, 10).map((q) => toQuestion(pm._id, q)),
    ...cfBank.slice(0, 10).map((q) => toQuestion(cf._id, q)),
    ...osBank.slice(0, 8).map((q) => toQuestion(os._id, q)),
    ...wpBank.slice(0, 8).map((q) => toQuestion(wp._id, q)),
    ...esBank.slice(0, 8).map((q) => toQuestion(es._id, q)),
    ...dbBank.slice(0, 8).map((q) => toQuestion(db._id, q)),
    ...psBank.slice(0, 6).map((q) => toQuestion(ps._id, q)),
    ...webBank.slice(0, 8).map((q) => toQuestion(web._id, q)),
    ...netBank.slice(0, 8).map((q) => toQuestion(net._id, q)),
    ...cyberBank.slice(0, 6).map((q) => toQuestion(cyber._id, q)),
    ...hwBank.slice(0, 6).map((q) => toQuestion(hw._id, q)),
    ...lawBank.slice(0, 4).map((q) => toQuestion(law._id, q)),
  ];

  if (allQuestions.length !== 100) {
    throw new Error(`Question bank size mismatch. Expected 100, got ${allQuestions.length}`);
  }

  await Question.insertMany(allQuestions.map((q) => ({ ...q, exam_id: exam._id, is_active: true })));

  await Subject.findByIdAndUpdate(ga._id, { question_count: 10 });
  await Subject.findByIdAndUpdate(pm._id, { question_count: 10 });
  await Subject.findByIdAndUpdate(cf._id, { question_count: 10 });
  await Subject.findByIdAndUpdate(os._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(wp._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(es._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(db._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(ps._id, { question_count: 6 });
  await Subject.findByIdAndUpdate(web._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(net._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(cyber._id, { question_count: 6 });
  await Subject.findByIdAndUpdate(hw._id, { question_count: 6 });
  await Subject.findByIdAndUpdate(law._id, { question_count: 4 });

  const mockConfig = {
    auto_generate: true,
    subject_distribution: [
      { subject_id: ga._id, count: 10, difficulty_split: { easy: 50, medium: 40, hard: 10 } },
      { subject_id: pm._id, count: 10, difficulty_split: { easy: 45, medium: 45, hard: 10 } },
      { subject_id: cf._id, count: 3, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
      { subject_id: os._id, count: 2, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
      { subject_id: wp._id, count: 4, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
      { subject_id: es._id, count: 3, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
      { subject_id: db._id, count: 3, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
      { subject_id: ps._id, count: 2, difficulty_split: { easy: 50, medium: 35, hard: 15 } },
      { subject_id: web._id, count: 2, difficulty_split: { easy: 50, medium: 35, hard: 15 } },
      { subject_id: net._id, count: 2, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
      { subject_id: cyber._id, count: 3, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
      { subject_id: hw._id, count: 2, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
      { subject_id: law._id, count: 4, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
    ],
  };

  await MockTest.create({
    exam_id: exam._id,
    title: 'Computer Operator Full Mock Test #1',
    slug: 'co-full-mock-1',
    duration_minutes: 45,
    total_questions: 50,
    total_marks: 100,
    negative_marking: 0.2,
    config: mockConfig,
    is_active: true,
  });

  await MockTest.create({
    exam_id: exam._id,
    title: 'Computer Operator Full Mock Test #2',
    slug: 'co-full-mock-2',
    duration_minutes: 45,
    total_questions: 50,
    total_marks: 100,
    negative_marking: 0.2,
    config: {
      auto_generate: true,
      subject_distribution: [
        { subject_id: ga._id, count: 10, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
        { subject_id: pm._id, count: 10, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
        { subject_id: cf._id, count: 3, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: os._id, count: 2, difficulty_split: { easy: 30, medium: 45, hard: 25 } },
        { subject_id: wp._id, count: 4, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        { subject_id: es._id, count: 3, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        { subject_id: db._id, count: 3, difficulty_split: { easy: 30, medium: 45, hard: 25 } },
        { subject_id: ps._id, count: 2, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        { subject_id: web._id, count: 2, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        { subject_id: net._id, count: 2, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: cyber._id, count: 3, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: hw._id, count: 2, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: law._id, count: 4, difficulty_split: { easy: 30, medium: 45, hard: 25 } },
      ],
    },
    is_active: true,
  });

  console.log(`✓ Exam: ${exam.name}`);
  console.log(`✓ Subjects: ${subjects.map((s) => s.name).join(', ')}`);
  console.log(`✓ Questions: ${allQuestions.length}`);
  console.log('✓ Mock Tests: Computer Operator Full Mock Test #1, Computer Operator Full Mock Test #2');
  await ensureTextIndexes();
  console.log('✓ Text indexes ensured (questions, exams)');
  console.log('\n🎉 Seed complete! Run: npm run dev');

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
