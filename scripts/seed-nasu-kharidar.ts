import mongoose from 'mongoose';
import { Exam, Subject, Question, MockTest } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';

async function ensureTextIndexes() {
  await Promise.all([
    Question.collection.createIndex({ question_text: 'text', tags: 'text' }),
    Exam.collection.createIndex({ name: 'text', description: 'text' }),
  ]);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  await Exam.deleteOne({ slug: 'nab-suchak' });
  await Exam.deleteOne({ slug: 'kharidar' });

  const nasu = await Exam.create({
    name: 'Nab Suchak (NaSu)',
    slug: 'nab-suchak',
    description: 'Loksewa Aayog — Nasu (Na.Su.) written exam',
    duration_minutes: 120, total_marks: 100, total_questions: 100,
    negative_marking: 0.25, passing_marks: 40,
    pattern_config: {
      sections: [
        { name: 'General Knowledge', questions_count: 30, marks_per_question: 1, negative_marks_per_wrong: 0.25 },
        { name: 'Nepali', questions_count: 20, marks_per_question: 1, negative_marks_per_wrong: 0.25 },
        { name: 'English', questions_count: 20, marks_per_question: 1, negative_marks_per_wrong: 0.25 },
        { name: 'Arithmetic', questions_count: 15, marks_per_question: 1, negative_marks_per_wrong: 0.25 },
        { name: 'Computer Basics', questions_count: 15, marks_per_question: 1, negative_marks_per_wrong: 0.25 },
      ],
      shuffle_questions: true, shuffle_options: true,
    },
    is_active: true,
  });

  const kharidar = await Exam.create({
    name: 'Kharidar',
    slug: 'kharidar',
    description: 'Loksewa Aayog — Kharidar written exam',
    duration_minutes: 90, total_marks: 75, total_questions: 50,
    negative_marking: 0.25, passing_marks: 30,
    pattern_config: {
      sections: [
        { name: 'General Knowledge', questions_count: 18, marks_per_question: 1.5, negative_marks_per_wrong: 0.25 },
        { name: 'Nepali', questions_count: 12, marks_per_question: 1.5, negative_marks_per_wrong: 0.25 },
        { name: 'English', questions_count: 10, marks_per_question: 1.5, negative_marks_per_wrong: 0.25 },
        { name: 'Arithmetic', questions_count: 10, marks_per_question: 1.5, negative_marks_per_wrong: 0.25 },
      ],
      shuffle_questions: true, shuffle_options: true,
    },
    is_active: true,
  });

  const nasuSubjects = await Subject.insertMany([
    { exam_id: nasu._id, name: 'General Knowledge', slug: 'general-knowledge', weightage_percent: 30, is_active: true },
    { exam_id: nasu._id, name: 'Nepali', slug: 'nepali', weightage_percent: 20, is_active: true },
    { exam_id: nasu._id, name: 'English', slug: 'english', weightage_percent: 20, is_active: true },
    { exam_id: nasu._id, name: 'Arithmetic', slug: 'arithmetic', weightage_percent: 15, is_active: true },
    { exam_id: nasu._id, name: 'Computer Basics', slug: 'computer-basics', weightage_percent: 15, is_active: true },
  ]);
  const [ngk, nnep, neng, narith, ncomp] = nasuSubjects;

  const kharidarSubjects = await Subject.insertMany([
    { exam_id: kharidar._id, name: 'General Knowledge', slug: 'general-knowledge', weightage_percent: 35, is_active: true },
    { exam_id: kharidar._id, name: 'Nepali', slug: 'nepali', weightage_percent: 25, is_active: true },
    { exam_id: kharidar._id, name: 'English', slug: 'english', weightage_percent: 20, is_active: true },
    { exam_id: kharidar._id, name: 'Arithmetic', slug: 'arithmetic', weightage_percent: 20, is_active: true },
  ]);
  const [kgk, knep, keng, karith] = kharidarSubjects;

  const nasuQuestions = [
    // NaSu - General Knowledge
    { subject_id: ngk._id, question_text: 'नेपालको संविधान २०७२ अनुसार संघीय संसद कति सदनात्मक छ?', options: [{ index: 0, text: 'एक सदनात्मक' }, { index: 1, text: 'दुई सदनात्मक' }, { index: 2, text: 'तीन सदनात्मक' }, { index: 3, text: 'चार सदनात्मक' }], correct_answer: 1, explanation: 'संविधान २०७२ ले संघीय संसदलाई प्रतिनिधि सभा र राष्ट्रिय सभा गरी दुई सदनात्मक व्यवस्था गरेको छ। लोकसेवा प्रश्नमा “द्विसदनीय” शब्द पनि सोधिन सक्छ।', difficulty: 'easy', year: 2023, tags: ['constitution', 'parliament'] },
    { subject_id: ngk._id, question_text: 'संयुक्त राष्ट्र संघको स्थापना कहिले भएको हो?', options: [{ index: 0, text: '1943' }, { index: 1, text: '1945' }, { index: 2, text: '1948' }, { index: 3, text: '1950' }], correct_answer: 1, explanation: 'UN को स्थापना 24 अक्टोबर 1945 मा भएको हो। नेपाल 1955 मा UN को सदस्य बनेको तथ्य पनि GK मा जोडेर सोधिन्छ।', difficulty: 'easy', tags: ['un', 'international'] },
    { subject_id: ngk._id, question_text: 'नेपाल राष्ट्र बैंक कहिले स्थापना भएको हो?', options: [{ index: 0, text: 'वि.सं. 2010' }, { index: 1, text: 'वि.सं. 2013' }, { index: 2, text: 'वि.सं. 2016' }, { index: 3, text: 'वि.सं. 2020' }], correct_answer: 1, explanation: 'नेपाल राष्ट्र बैंक वि.सं. २०१३ मा स्थापना भएको हो। परीक्षा तयारीमा AD/BS दुवै वर्ष रुपान्तरणमा ध्यान दिनुपर्छ।', difficulty: 'medium', tags: ['nepal', 'economy'] },
    { subject_id: ngk._id, question_text: '“सगरमाथा राष्ट्रिय निकुञ्ज” कुन जिल्लामा पर्छ?', options: [{ index: 0, text: 'रसुवा' }, { index: 1, text: 'मुस्ताङ' }, { index: 2, text: 'सोलुखुम्बु' }, { index: 3, text: 'ताप्लेजुङ' }], correct_answer: 2, explanation: 'सगरमाथा राष्ट्रिय निकुञ्ज सोलुखुम्बु जिल्लामा पर्छ। राष्ट्रिय निकुञ्ज र जिल्ला मिलान गर्ने प्रश्न लोकसेवामा बारम्बार दोहोरिन्छ।', difficulty: 'easy', tags: ['geography', 'national-park'] },
    { subject_id: ngk._id, question_text: 'SAARC को मुख्यालय कहाँ रहेको छ?', options: [{ index: 0, text: 'नयाँ दिल्ली' }, { index: 1, text: 'काठमाडौँ' }, { index: 2, text: 'ढाका' }, { index: 3, text: 'इस्लामाबाद' }], correct_answer: 1, explanation: 'SAARC Secretariat काठमाडौँमा रहेको छ। क्षेत्रीय संगठनका मुख्यालय सम्बन्धी प्रश्न GK मा धेरै आउँछ।', difficulty: 'easy', tags: ['saarc', 'hq'] },
    { subject_id: ngk._id, question_text: 'नेपालमा स्थानीय तहको निर्वाचन कुन संवैधानिक निकायको जिम्मेवारीमा हुन्छ?', options: [{ index: 0, text: 'राष्ट्रिय योजना आयोग' }, { index: 1, text: 'लोक सेवा आयोग' }, { index: 2, text: 'निर्वाचन आयोग' }, { index: 3, text: 'महालेखा परीक्षक' }], correct_answer: 2, explanation: 'निर्वाचन आयोगले संघ, प्रदेश र स्थानीय तहको निर्वाचन सञ्चालन गर्छ। संवैधानिक निकायको काम/अधिकार मिलान गर्ने प्रश्न महत्वपूर्ण छ।', difficulty: 'medium', tags: ['constitutional-body', 'election'] },
    { subject_id: ngk._id, question_text: 'गौतम बुद्धको जन्मस्थल लुम्बिनी कुन प्रदेशमा पर्छ?', options: [{ index: 0, text: 'मधेश प्रदेश' }, { index: 1, text: 'लुम्बिनी प्रदेश' }, { index: 2, text: 'गण्डकी प्रदेश' }, { index: 3, text: 'कोशी प्रदेश' }], correct_answer: 1, explanation: 'लुम्बिनी रुपन्देही जिल्लामा पर्छ र हाल लुम्बिनी प्रदेश अन्तर्गत पर्छ। हालको प्रदेश संरचनाअनुसार उत्तर दिनु जरुरी हुन्छ।', difficulty: 'easy', tags: ['province', 'heritage'] },
    { subject_id: ngk._id, question_text: 'नेपालको राष्ट्रिय जनगणना कति कति वर्षमा गरिन्छ?', options: [{ index: 0, text: 'प्रत्येक 5 वर्ष' }, { index: 1, text: 'प्रत्येक 8 वर्ष' }, { index: 2, text: 'प्रत्येक 10 वर्ष' }, { index: 3, text: 'प्रत्येक 12 वर्ष' }], correct_answer: 2, explanation: 'राष्ट्रिय जनगणना सामान्यतया प्रत्येक १० वर्षमा हुने व्यवस्था छ। योजना निर्माण र स्रोत बाँडफाँटसँग यसलाई जोडेर प्रश्न आउँछ।', difficulty: 'easy', tags: ['census', 'planning'] },

    // NaSu - Nepali
    { subject_id: nnep._id, question_text: '“मिहिनेती” शब्दको सही विपरीतार्थी कुन हो?', options: [{ index: 0, text: 'परिश्रमी' }, { index: 1, text: 'आलसी' }, { index: 2, text: 'मेहेनती' }, { index: 3, text: 'सक्षम' }], correct_answer: 1, explanation: '“मिहिनेती/मेहेनती” को विपरीतार्थी “आलसी” हुन्छ। समानार्थी र विपरीतार्थी छुट्याउने क्षमता भाषिक प्रश्नको आधार हो।', difficulty: 'easy', tags: ['antonym', 'vocabulary'] },
    { subject_id: nnep._id, question_text: 'तलमध्ये कुन वाक्य शुद्ध छ?', options: [{ index: 0, text: 'म स्कूल जान्छु।' }, { index: 1, text: 'म स्कूल जान्छ।' }, { index: 2, text: 'म स्कुल जान्छु।' }, { index: 3, text: 'म स्कुल जान्छ।' }], correct_answer: 2, explanation: 'कर्तृ “म” सँग क्रिया “जान्छु” आउँछ। साथै “स्कुल/विद्यालय” प्रचलित लेख्यरूप हो। लोकसेवामा कर्ता-क्रिया मिलान निर्णायक हुन्छ।', difficulty: 'medium', tags: ['grammar', 'sentence'] },
    { subject_id: nnep._id, question_text: '“नेपाली भाषाको प्रथम व्याकरण” का लेखक को मानिन्छ?', options: [{ index: 0, text: 'भानुभक्त आचार्य' }, { index: 1, text: 'हेमराज पण्डित' }, { index: 2, text: 'मोतीराम भट्ट' }, { index: 3, text: 'लक्ष्मीप्रसाद देवकोटा' }], correct_answer: 1, explanation: 'हेमराज पण्डितलाई नेपाली व्याकरणको प्रारम्भिक आधार निर्माणमा प्रमुख मानिन्छ। भाषा-साहित्य इतिहास प्रश्नमा व्यक्ति-कृति मिलाउनुपर्छ।', difficulty: 'hard', tags: ['literature', 'history'] },
    { subject_id: nnep._id, question_text: '“घरघरमा पानी पुगेको छ।” वाक्यमा “घरघरमा” कुन कारक हो?', options: [{ index: 0, text: 'कर्ता कारक' }, { index: 1, text: 'कर्म कारक' }, { index: 2, text: 'अधिकरण कारक' }, { index: 3, text: 'सम्बन्ध कारक' }], correct_answer: 2, explanation: '“मा” विभक्तिले स्थान जनाउँछ, जसलाई अधिकरण कारक मानिन्छ। विभक्ति चिनेर कारक छुट्याउनु उत्तम रणनीति हो।', difficulty: 'medium', tags: ['karak', 'grammar'] },
    { subject_id: nnep._id, question_text: '“आकाशबाट पानी प-यो” मा “प-यो” को सही रूप कुन हो?', options: [{ index: 0, text: 'पर्‍यो' }, { index: 1, text: 'परयो' }, { index: 2, text: 'प-यो' }, { index: 3, text: 'पार्‍यो' }], correct_answer: 0, explanation: 'सही लेख्यरूप “पर्‍यो” हो। यस्तै ह्रस्व/दीर्घ, हलन्त र संयुक्त अक्षर सम्बन्धी प्रश्न बारम्बार सोधिन्छ।', difficulty: 'easy', tags: ['spelling', 'orthography'] },
    { subject_id: nnep._id, question_text: 'तलमध्ये कुन उखानको अर्थ “ढिलो भए पनि राम्रो परिणाम आउँछ” सँग नजिक छ?', options: [{ index: 0, text: 'ढिलो भए पनि अँध्यारो हुँदैन' }, { index: 1, text: 'ढिलो आए पनि दुरुस्त आए' }, { index: 2, text: 'नाच्न नजान्ने आँगन टेढो' }, { index: 3, text: 'आफू भलो त जगत् भलो' }], correct_answer: 1, explanation: '“ढिलो आए पनि दुरुस्त आए” ले समयभन्दा गुणस्तरलाई प्राथमिकता दिन्छ। उखान-टुक्काको सन्दर्भगत अर्थ बुझ्नुपर्छ।', difficulty: 'easy', tags: ['idiom', 'proverb'] },
    { subject_id: nnep._id, question_text: '“विद्यार्थीहरूले पुस्तक पढे।” यस वाक्यमा “पुस्तक” कुन पद हो?', options: [{ index: 0, text: 'कर्ता' }, { index: 1, text: 'कर्म' }, { index: 2, text: 'क्रिया' }, { index: 3, text: 'विशेषण' }], correct_answer: 1, explanation: 'वाक्यमा क्रियाको असर पर्ने वस्तु “कर्म” हो। यहाँ पढ्ने क्रियाको वस्तु “पुस्तक” भएकाले कर्म पद हुन्छ।', difficulty: 'easy', tags: ['grammar', 'syntax'] },
    { subject_id: nnep._id, question_text: '“निराश” शब्दको समानार्थी कुन हो?', options: [{ index: 0, text: 'आशावादी' }, { index: 1, text: 'हतास' }, { index: 2, text: 'उत्साहित' }, { index: 3, text: 'सन्तुष्ट' }], correct_answer: 1, explanation: '“निराश” को समानार्थी “हतास” हो। विकल्पमा एउटै समूहका अर्थ नजिक शब्द छुट्याउने अभ्यासले स्कोर बढाउँछ।', difficulty: 'easy', tags: ['synonym', 'vocabulary'] },

    // NaSu - English
    { subject_id: neng._id, question_text: 'Choose the correct passive voice: “The committee approved the proposal.”', options: [{ index: 0, text: 'The proposal was approved by the committee.' }, { index: 1, text: 'The proposal is approved by committee.' }, { index: 2, text: 'The proposal had approved by the committee.' }, { index: 3, text: 'The proposal was approve by the committee.' }], correct_answer: 0, explanation: 'Simple past active converts to “was/were + past participle” in passive. Therefore, “was approved” is correct.', difficulty: 'medium', tags: ['grammar', 'voice'] },
    { subject_id: neng._id, question_text: 'Select the synonym of “mandatory”.', options: [{ index: 0, text: 'Optional' }, { index: 1, text: 'Compulsory' }, { index: 2, text: 'Temporary' }, { index: 3, text: 'Flexible' }], correct_answer: 1, explanation: '“Mandatory” means required by rule/law, which is best matched by “compulsory.”', difficulty: 'easy', tags: ['vocabulary', 'synonym'] },
    { subject_id: neng._id, question_text: 'Fill in the blank: If I ____ enough money, I would buy a laptop.', options: [{ index: 0, text: 'have' }, { index: 1, text: 'had' }, { index: 2, text: 'will have' }, { index: 3, text: 'am having' }], correct_answer: 1, explanation: 'This is second conditional structure: If + past simple, would + base verb. So “had” is correct.', difficulty: 'medium', tags: ['conditional', 'grammar'] },
    { subject_id: neng._id, question_text: 'Choose the correctly punctuated sentence.', options: [{ index: 0, text: 'Ram said lets start now.' }, { index: 1, text: 'Ram said, “Let’s start now.”' }, { index: 2, text: 'Ram said “Lets start now”.' }, { index: 3, text: 'Ram said, lets start now.' }], correct_answer: 1, explanation: 'Direct speech needs comma + quotation marks and apostrophe in “Let’s”. Proper punctuation is heavily tested in objective English.', difficulty: 'easy', tags: ['punctuation'] },
    { subject_id: neng._id, question_text: 'Choose the antonym of “scarce”.', options: [{ index: 0, text: 'Rare' }, { index: 1, text: 'Insufficient' }, { index: 2, text: 'Abundant' }, { index: 3, text: 'Limited' }], correct_answer: 2, explanation: '“Scarce” means not enough; its opposite is “abundant” (plentiful).', difficulty: 'easy', tags: ['vocabulary', 'antonym'] },
    { subject_id: neng._id, question_text: 'Identify the correct preposition: She is good ____ mathematics.', options: [{ index: 0, text: 'at' }, { index: 1, text: 'in' }, { index: 2, text: 'on' }, { index: 3, text: 'for' }], correct_answer: 0, explanation: 'Standard collocation is “good at” for skill/subject performance. Such collocations are common in PSC language papers.', difficulty: 'easy', tags: ['preposition', 'usage'] },
    { subject_id: neng._id, question_text: 'Choose the correct reported speech: He said, “I am preparing for Loksewa.”', options: [{ index: 0, text: 'He said that he is preparing for Loksewa.' }, { index: 1, text: 'He said that he was preparing for Loksewa.' }, { index: 2, text: 'He said he preparing for Loksewa.' }, { index: 3, text: 'He told that he was preparing for Loksewa.' }], correct_answer: 1, explanation: 'In reported speech, present continuous often backshifts to past continuous when reporting in past: “was preparing.”', difficulty: 'medium', tags: ['reported-speech'] },
    { subject_id: neng._id, question_text: 'Pick the sentence with correct subject-verb agreement.', options: [{ index: 0, text: 'Each of the students are present.' }, { index: 1, text: 'Each of the students is present.' }, { index: 2, text: 'Each of the student are present.' }, { index: 3, text: 'Each students is present.' }], correct_answer: 1, explanation: '“Each” is singular, so singular verb “is” must be used even if followed by a plural noun phrase.', difficulty: 'medium', tags: ['sva', 'grammar'] },

    // NaSu - Arithmetic
    { subject_id: narith._id, question_text: 'A number is increased by 20% and then decreased by 20%. What is the net change?', options: [{ index: 0, text: 'No change' }, { index: 1, text: '4% increase' }, { index: 2, text: '4% decrease' }, { index: 3, text: '2% decrease' }], correct_answer: 2, explanation: 'Assume 100. After +20% => 120. Then −20% of 120 => 96. Net = 4% decrease. Percentage on changed base is a common trap.', difficulty: 'medium', tags: ['percentage'] },
    { subject_id: narith._id, question_text: 'The ratio of boys to girls is 3:2. If total students are 50, how many girls are there?', options: [{ index: 0, text: '20' }, { index: 1, text: '25' }, { index: 2, text: '30' }, { index: 3, text: '15' }], correct_answer: 0, explanation: 'Total parts = 3+2 = 5. One part = 50/5 = 10. Girls = 2 parts = 20.', difficulty: 'easy', tags: ['ratio'] },
    { subject_id: narith._id, question_text: 'Simple interest on Rs. 10,000 at 10% per annum for 2 years is:', options: [{ index: 0, text: 'Rs. 1,000' }, { index: 1, text: 'Rs. 1,500' }, { index: 2, text: 'Rs. 2,000' }, { index: 3, text: 'Rs. 2,200' }], correct_answer: 2, explanation: 'SI = (P×R×T)/100 = (10000×10×2)/100 = 2000. In PSC arithmetic, formula recall and unit consistency are key.', difficulty: 'easy', tags: ['interest'] },
    { subject_id: narith._id, question_text: 'If 12 workers complete a job in 15 days, in how many days will 20 workers complete the same job?', options: [{ index: 0, text: '9 days' }, { index: 1, text: '10 days' }, { index: 2, text: '12 days' }, { index: 3, text: '8 days' }], correct_answer: 0, explanation: 'Work = workers × days = 12×15 = 180 worker-days. Required days = 180/20 = 9 days.', difficulty: 'medium', tags: ['time-work'] },
    { subject_id: narith._id, question_text: 'The average of 5 numbers is 24. If four of them are 20, 22, 25, 27, the fifth number is:', options: [{ index: 0, text: '24' }, { index: 1, text: '26' }, { index: 2, text: '28' }, { index: 3, text: '30' }], correct_answer: 1, explanation: 'Total sum = 24×5 = 120. Sum of given four = 94. Fifth number = 120−94 = 26.', difficulty: 'easy', tags: ['average'] },
    { subject_id: narith._id, question_text: 'A train travels 180 km in 3 hours. Its speed is:', options: [{ index: 0, text: '50 km/h' }, { index: 1, text: '55 km/h' }, { index: 2, text: '60 km/h' }, { index: 3, text: '65 km/h' }], correct_answer: 2, explanation: 'Speed = distance/time = 180/3 = 60 km/h. Speed-distance-time conversions are frequently tested.', difficulty: 'easy', tags: ['speed-distance-time'] },
    { subject_id: narith._id, question_text: 'Find 15% of 640.', options: [{ index: 0, text: '86' }, { index: 1, text: '96' }, { index: 2, text: '106' }, { index: 3, text: '116' }], correct_answer: 1, explanation: '10% of 640 = 64, and 5% = 32. So 15% = 64+32 = 96.', difficulty: 'easy', tags: ['percentage'] },
    { subject_id: narith._id, question_text: 'LCM of 12 and 18 is:', options: [{ index: 0, text: '24' }, { index: 1, text: '30' }, { index: 2, text: '36' }, { index: 3, text: '48' }], correct_answer: 2, explanation: '12 = 2²×3 and 18 = 2×3². LCM takes highest powers => 2²×3² = 36.', difficulty: 'medium', tags: ['lcm-hcf'] },

    // NaSu - Computer Basics
    { subject_id: ncomp._id, question_text: 'Which of the following is an operating system?', options: [{ index: 0, text: 'MS Excel' }, { index: 1, text: 'Google Chrome' }, { index: 2, text: 'Windows 11' }, { index: 3, text: 'Adobe Reader' }], correct_answer: 2, explanation: 'Windows 11 is an operating system that manages hardware and software resources. Others are applications.', difficulty: 'easy', tags: ['os'] },
    { subject_id: ncomp._id, question_text: 'In MS Word, Ctrl+S is used to:', options: [{ index: 0, text: 'Save file' }, { index: 1, text: 'Select all' }, { index: 2, text: 'Spell check' }, { index: 3, text: 'Search text' }], correct_answer: 0, explanation: 'Ctrl+S saves current document. Shortcut-based questions are very common in computer sections of Loksewa exams.', difficulty: 'easy', tags: ['shortcut', 'ms-word'] },
    { subject_id: ncomp._id, question_text: 'Which device is primarily used to connect a computer to the internet?', options: [{ index: 0, text: 'Scanner' }, { index: 1, text: 'Modem/Router' }, { index: 2, text: 'Plotter' }, { index: 3, text: 'Projector' }], correct_answer: 1, explanation: 'A modem/router provides internet connectivity by routing network packets. Scanner/plotter/projector are peripheral devices.', difficulty: 'easy', tags: ['networking'] },
    { subject_id: ncomp._id, question_text: 'What does URL stand for?', options: [{ index: 0, text: 'Uniform Resource Locator' }, { index: 1, text: 'Universal Record Link' }, { index: 2, text: 'Uniform Record Locator' }, { index: 3, text: 'Universal Resource Link' }], correct_answer: 0, explanation: 'URL means Uniform Resource Locator, i.e., the web address used to locate resources on the internet.', difficulty: 'easy', tags: ['internet'] },
    { subject_id: ncomp._id, question_text: 'Which memory loses data when power is turned off?', options: [{ index: 0, text: 'ROM' }, { index: 1, text: 'RAM' }, { index: 2, text: 'SSD' }, { index: 3, text: 'Hard Disk' }], correct_answer: 1, explanation: 'RAM is volatile memory, so its data is cleared when power goes off. ROM/SSD/HDD are non-volatile storage.', difficulty: 'easy', tags: ['memory'] },
    { subject_id: ncomp._id, question_text: 'Which of the following is a valid cyber security best practice?', options: [{ index: 0, text: 'Use same password everywhere' }, { index: 1, text: 'Share OTP with support staff' }, { index: 2, text: 'Enable two-factor authentication' }, { index: 3, text: 'Ignore software updates' }], correct_answer: 2, explanation: 'Two-factor authentication (2FA) significantly reduces unauthorized access risk. OTP/password sharing is unsafe.', difficulty: 'medium', tags: ['cyber-security'] },
    { subject_id: ncomp._id, question_text: 'In Excel, the intersection of a row and a column is called:', options: [{ index: 0, text: 'Table' }, { index: 1, text: 'Range' }, { index: 2, text: 'Cell' }, { index: 3, text: 'Field' }], correct_answer: 2, explanation: 'A single box formed by row and column is called a cell (e.g., B3).', difficulty: 'easy', tags: ['ms-excel'] },
    { subject_id: ncomp._id, question_text: 'Which file extension is commonly used for PDF documents?', options: [{ index: 0, text: '.docx' }, { index: 1, text: '.xlsx' }, { index: 2, text: '.pdf' }, { index: 3, text: '.pptx' }], correct_answer: 2, explanation: 'Portable Document Format files use .pdf extension. Format recognition is frequently asked in objective computer tests.', difficulty: 'easy', tags: ['file-format'] },
  ];

  const kharidarQuestions = [
    // Kharidar - General Knowledge
    { subject_id: kgk._id, question_text: 'नेपालमा हाल कति प्रदेश छन्?', options: [{ index: 0, text: '5' }, { index: 1, text: '6' }, { index: 2, text: '7' }, { index: 3, text: '8' }], correct_answer: 2, explanation: 'नेपाल संघीय संरचनाअनुसार ७ प्रदेशमा विभाजित छ। प्रदेशको नाम/मुख्यमन्त्री/राजधानी सम्बन्धी प्रश्नसँगै सोधिन सक्छ।', difficulty: 'easy', tags: ['federalism', 'province'] },
    { subject_id: kgk._id, question_text: 'विश्व वातावरण दिवस कहिले मनाइन्छ?', options: [{ index: 0, text: 'जुन 1' }, { index: 1, text: 'जुन 5' }, { index: 2, text: 'जुन 8' }, { index: 3, text: 'जुन 15' }], correct_answer: 1, explanation: 'विश्व वातावरण दिवस प्रत्येक वर्ष जुन ५ मा मनाइन्छ। दिवस/थीम प्रकारका प्रश्न GK मा नियमित हुन्छन्।', difficulty: 'easy', tags: ['important-days'] },
    { subject_id: kgk._id, question_text: 'नेपालको सबैभन्दा लामो नदी प्रणाली कुन हो?', options: [{ index: 0, text: 'कर्णाली' }, { index: 1, text: 'कोशी' }, { index: 2, text: 'गण्डकी' }, { index: 3, text: 'महाकाली' }], correct_answer: 0, explanation: 'कर्णाली नेपालकै सबैभन्दा लामो नदी प्रणाली मानिन्छ। नदी सम्बन्धी GK मा “लामो/ठूलो जलाधार” भिन्न हुन सक्छ, ध्यान दिनुपर्छ।', difficulty: 'medium', tags: ['geography', 'river'] },
    { subject_id: kgk._id, question_text: 'लोक सेवा आयोगको संवैधानिक व्यवस्था कुन भागमा उल्लेख छ?', options: [{ index: 0, text: 'मौलिक हक' }, { index: 1, text: 'राज्यका निर्देशक सिद्धान्त' }, { index: 2, text: 'संवैधानिक निकाय' }, { index: 3, text: 'न्यायपालिका' }], correct_answer: 2, explanation: 'लोक सेवा आयोग संविधानमा संवैधानिक निकायका रूपमा व्यवस्था गरिएको छ। आयोगको संरचना/कार्य/अधिकार परीक्षामा सोधिन्छ।', difficulty: 'medium', tags: ['constitution', 'psc'] },
    { subject_id: kgk._id, question_text: 'नेपालको समय GMT भन्दा कति अगाडि छ?', options: [{ index: 0, text: '5 घण्टा' }, { index: 1, text: '5 घण्टा 30 मिनेट' }, { index: 2, text: '5 घण्टा 45 मिनेट' }, { index: 3, text: '6 घण्टा' }], correct_answer: 2, explanation: 'नेपाल मानक समय GMT/UTC भन्दा 5 घण्टा 45 मिनेट अगाडि (UTC+5:45) छ।', difficulty: 'easy', tags: ['time-zone'] },
    { subject_id: kgk._id, question_text: 'नेपालमा प्रथम निर्वाचित प्रधानमन्त्री को हुन्?', options: [{ index: 0, text: 'टंकप्रसाद आचार्य' }, { index: 1, text: 'बी.पी. कोइराला' }, { index: 2, text: 'मातृका प्रसाद कोइराला' }, { index: 3, text: 'कृष्ण प्रसाद भट्टराई' }], correct_answer: 1, explanation: '१९५९ को आमनिर्वाचनपछि बी.पी. कोइराला नेपालका प्रथम निर्वाचित प्रधानमन्त्री बने। इतिहास GK मा वर्षसँगै प्रश्न आउन सक्छ।', difficulty: 'medium', tags: ['history', 'politics'] },
    { subject_id: kgk._id, question_text: 'ASEAN कुन क्षेत्रीय संगठन हो?', options: [{ index: 0, text: 'दक्षिण एसिया' }, { index: 1, text: 'दक्षिणपूर्व एसिया' }, { index: 2, text: 'पूर्व एसिया' }, { index: 3, text: 'मध्य एसिया' }], correct_answer: 1, explanation: 'ASEAN = Association of Southeast Asian Nations, अर्थात दक्षिणपूर्व एसियाली राष्ट्रहरूको संगठन।', difficulty: 'easy', tags: ['international-org'] },
    { subject_id: kgk._id, question_text: 'नेपालको राष्ट्रिय झण्डा विश्वमा किन विशेष मानिन्छ?', options: [{ index: 0, text: 'सबैभन्दा ठूलो भएकाले' }, { index: 1, text: 'एक मात्र आयताकार नभएको राष्ट्रिय झण्डा भएकाले' }, { index: 2, text: 'रातो रङ मात्र भएकाले' }, { index: 3, text: 'तारा प्रतीक भएकाले' }], correct_answer: 1, explanation: 'नेपालको झण्डा दुई त्रिकोणीय संरचनाको हुन्छ र राष्ट्रिय झण्डाहरूमा एक मात्र गैर-आयताकार झण्डा मानिन्छ।', difficulty: 'easy', tags: ['national-symbol'] },

    // Kharidar - Nepali
    { subject_id: knep._id, question_text: '“आँखा खुल्नु” भन्ने उखानको सही अर्थ कुन हो?', options: [{ index: 0, text: 'निद्रा लाग्नु' }, { index: 1, text: 'ज्ञान/चेतना हुनु' }, { index: 2, text: 'आँखा दुख्नु' }, { index: 3, text: 'रुनु' }], correct_answer: 1, explanation: '“आँखा खुल्नु” ले वास्तविकता बुझ्नु वा चेतना आउनु भन्ने भाव दिन्छ। उखानमा शाब्दिक होइन भावार्थ महत्त्वपूर्ण हुन्छ।', difficulty: 'easy', tags: ['idiom'] },
    { subject_id: knep._id, question_text: '“विद्यार्थी” शब्दको बहुवचन रूप कुन हो?', options: [{ index: 0, text: 'विद्यार्थीहरु' }, { index: 1, text: 'विद्यार्थीहरू' }, { index: 2, text: 'विद्यार्थिहरु' }, { index: 3, text: 'विद्यार्थीह्रु' }], correct_answer: 1, explanation: 'सही मानक रूप “विद्यार्थीहरू” हो। लेख्य मानकीकरण (मात्रा/विराम) भाषा खण्डमा स्कोरिङ बिन्दु हो।', difficulty: 'easy', tags: ['grammar', 'orthography'] },
    { subject_id: knep._id, question_text: 'तलमध्ये कुन शब्द तत्सम हो?', options: [{ index: 0, text: 'घाम' }, { index: 1, text: 'आगो' }, { index: 2, text: 'विद्यालय' }, { index: 3, text: 'डोको' }], correct_answer: 2, explanation: '“विद्यालय” संस्कृत मूलको तत्सम शब्द हो। तत्सम/तद्भव वर्गीकरण नियमित प्रश्न हो।', difficulty: 'medium', tags: ['etymology'] },
    { subject_id: knep._id, question_text: '“रामले कलमले लेख्यो” मा “कलमले” कुन कारक हो?', options: [{ index: 0, text: 'कर्ता' }, { index: 1, text: 'करण' }, { index: 2, text: 'कर्म' }, { index: 3, text: 'सम्बोधन' }], correct_answer: 1, explanation: '“ले” विभक्तिले उपकरण/साधन जनाउँदा करण कारक हुन्छ। यहाँ कलम लेख्ने साधन भएकाले करण हो।', difficulty: 'medium', tags: ['karak'] },
    { subject_id: knep._id, question_text: '“उहाँ” सर्वनाम कुन प्रकारको हो?', options: [{ index: 0, text: 'प्रश्नवाचक' }, { index: 1, text: 'निजवाचक' }, { index: 2, text: 'पुरुषवाचक' }, { index: 3, text: 'संकेतवाचक' }], correct_answer: 2, explanation: '“उहाँ” आदरार्थी पुरुषवाचक सर्वनाम हो। सर्वनाम वर्गीकरणबाट साना तर स्कोरिङ प्रश्न आउँछन्।', difficulty: 'easy', tags: ['pronoun'] },
    { subject_id: knep._id, question_text: '“काठमाडौँ नेपालको राजधानी हो।” यस वाक्यमा “नेपालको” कुन पद हो?', options: [{ index: 0, text: 'क्रियाविशेषण' }, { index: 1, text: 'सम्बन्धबोधक' }, { index: 2, text: 'सम्बन्ध कारक जनाउने विशेषण पद' }, { index: 3, text: 'कर्म पद' }], correct_answer: 2, explanation: '“नेपालको” ले “राजधानी” सँग सम्बन्ध देखाउँछ, सम्बन्ध कारकको भाव दिन्छ र संज्ञालाई विशेषित गर्छ।', difficulty: 'hard', tags: ['syntax', 'case'] },
    { subject_id: knep._id, question_text: 'तलको कुन वाक्य शुद्ध छ?', options: [{ index: 0, text: 'हामीहरु विद्यालय गयौं।' }, { index: 1, text: 'हामी विद्यालय गयौँ।' }, { index: 2, text: 'हामी विद्यालय गयो।' }, { index: 3, text: 'हामी विद्यालय गएकी।' }], correct_answer: 1, explanation: '“हामी” सँग “गयौँ” क्रिया मिल्छ। “हामीहरू” पनि प्रयोग गर्न सकिन्छ तर विकल्प १ मा रूपगत त्रुटि/अशुद्धि रहेको छ।', difficulty: 'medium', tags: ['sentence-correction'] },
    { subject_id: knep._id, question_text: '“दूधको जलेको छाछ पनि फुक्दै खान्छ” को आशय के हो?', options: [{ index: 0, text: 'धेरै खानुपर्छ' }, { index: 1, text: 'अनुभवपछि सजग भइन्छ' }, { index: 2, text: 'दूध स्वास्थ्यकर हो' }, { index: 3, text: 'छाछ नखानु' }], correct_answer: 1, explanation: 'पहिलेको खराब अनुभवले मानिसलाई पछि सतर्क बनाउँछ भन्ने यो उखानको मूल भाव हो।', difficulty: 'easy', tags: ['proverb'] },

    // Kharidar - English
    { subject_id: keng._id, question_text: 'Choose the correct sentence.', options: [{ index: 0, text: 'She do not like tea.' }, { index: 1, text: 'She does not likes tea.' }, { index: 2, text: 'She does not like tea.' }, { index: 3, text: 'She not likes tea.' }], correct_answer: 2, explanation: 'With “does not,” the main verb remains base form (“like”). Subject-verb and auxiliary agreement is key in objective English.', difficulty: 'easy', tags: ['grammar'] },
    { subject_id: keng._id, question_text: 'Select the correct one-word substitution: “A person who cannot read or write.”', options: [{ index: 0, text: 'Literate' }, { index: 1, text: 'Illiterate' }, { index: 2, text: 'Scholar' }, { index: 3, text: 'Editor' }], correct_answer: 1, explanation: 'A person unable to read/write is “illiterate.” One-word substitution is frequent in PSC English MCQs.', difficulty: 'easy', tags: ['vocabulary'] },
    { subject_id: keng._id, question_text: 'Fill in the blank: Kathmandu is one of the ____ cities in Nepal.', options: [{ index: 0, text: 'big' }, { index: 1, text: 'bigger' }, { index: 2, text: 'biggest' }, { index: 3, text: 'most big' }], correct_answer: 2, explanation: '“One of the + superlative + plural noun” is the correct structure, so “biggest cities.”', difficulty: 'medium', tags: ['degree', 'grammar'] },
    { subject_id: keng._id, question_text: 'Choose the correct preposition: The meeting starts ____ 10 AM.', options: [{ index: 0, text: 'in' }, { index: 1, text: 'on' }, { index: 2, text: 'at' }, { index: 3, text: 'for' }], correct_answer: 2, explanation: 'Use “at” for exact clock time (at 10 AM), “on” for dates/days, and “in” for months/years.', difficulty: 'easy', tags: ['preposition'] },
    { subject_id: keng._id, question_text: 'Choose the antonym of “ancient”.', options: [{ index: 0, text: 'Old' }, { index: 1, text: 'Historic' }, { index: 2, text: 'Modern' }, { index: 3, text: 'Traditional' }], correct_answer: 2, explanation: '“Ancient” means very old; its opposite is “modern.” Antonym/synonym questions are direct scoring opportunities.', difficulty: 'easy', tags: ['antonym'] },
    { subject_id: keng._id, question_text: 'Identify the correct tag question: “You are coming, ____?”', options: [{ index: 0, text: 'are you' }, { index: 1, text: 'aren’t you' }, { index: 2, text: 'do you' }, { index: 3, text: 'won’t you' }], correct_answer: 1, explanation: 'Positive statement takes negative tag in present auxiliary form: “aren’t you?”', difficulty: 'medium', tags: ['question-tag'] },
    { subject_id: keng._id, question_text: 'Choose the correct reported speech: She said, “I have finished my work.”', options: [{ index: 0, text: 'She said that she has finished her work.' }, { index: 1, text: 'She said that she had finished her work.' }, { index: 2, text: 'She said that I had finished my work.' }, { index: 3, text: 'She told that she had finished her work.' }], correct_answer: 1, explanation: 'Present perfect in direct speech often changes to past perfect in indirect speech when reporting in past.', difficulty: 'medium', tags: ['reported-speech'] },
    { subject_id: keng._id, question_text: 'Pick the correctly spelled word.', options: [{ index: 0, text: 'Goverment' }, { index: 1, text: 'Government' }, { index: 2, text: 'Govenrment' }, { index: 3, text: 'Governmant' }], correct_answer: 1, explanation: 'Correct spelling is “Government.” Official writing-focused exams frequently include spelling checks.', difficulty: 'easy', tags: ['spelling'] },

    // Kharidar - Arithmetic
    { subject_id: karith._id, question_text: 'If CP = Rs. 800 and SP = Rs. 920, profit percent is:', options: [{ index: 0, text: '12%' }, { index: 1, text: '15%' }, { index: 2, text: '18%' }, { index: 3, text: '20%' }], correct_answer: 1, explanation: 'Profit = 920−800 = 120. Profit% = (120/800)×100 = 15%.', difficulty: 'easy', tags: ['profit-loss'] },
    { subject_id: karith._id, question_text: 'A sum doubles in 10 years at simple interest. Rate of interest is:', options: [{ index: 0, text: '5%' }, { index: 1, text: '8%' }, { index: 2, text: '10%' }, { index: 3, text: '12%' }], correct_answer: 2, explanation: 'If money doubles, SI equals principal in 10 years. So (P×R×10)/100 = P => R = 10%.', difficulty: 'medium', tags: ['interest'] },
    { subject_id: karith._id, question_text: 'What is 25% of 480?', options: [{ index: 0, text: '100' }, { index: 1, text: '110' }, { index: 2, text: '120' }, { index: 3, text: '130' }], correct_answer: 2, explanation: '25% means one-fourth. 480/4 = 120.', difficulty: 'easy', tags: ['percentage'] },
    { subject_id: karith._id, question_text: 'The HCF of 24 and 36 is:', options: [{ index: 0, text: '6' }, { index: 1, text: '8' }, { index: 2, text: '10' }, { index: 3, text: '12' }], correct_answer: 3, explanation: 'Factors of 24 and 36 have highest common factor 12. HCF/LCM pair problems are standard Loksewa arithmetic topics.', difficulty: 'easy', tags: ['hcf-lcm'] },
    { subject_id: karith._id, question_text: 'If 5 pens cost Rs. 75, what is the cost of 8 pens at the same rate?', options: [{ index: 0, text: 'Rs. 100' }, { index: 1, text: 'Rs. 110' }, { index: 2, text: 'Rs. 120' }, { index: 3, text: 'Rs. 130' }], correct_answer: 2, explanation: 'Unitary method: One pen = 75/5 = 15. Eight pens = 15×8 = 120.', difficulty: 'easy', tags: ['unitary-method'] },
    { subject_id: karith._id, question_text: 'Average of 12, 15, 18, 21 and 24 is:', options: [{ index: 0, text: '17' }, { index: 1, text: '18' }, { index: 2, text: '19' }, { index: 3, text: '20' }], correct_answer: 1, explanation: 'Sum = 90 and count = 5, so average = 90/5 = 18.', difficulty: 'easy', tags: ['average'] },
    { subject_id: karith._id, question_text: 'A bus covers 240 km in 4 hours. What is its average speed?', options: [{ index: 0, text: '50 km/h' }, { index: 1, text: '55 km/h' }, { index: 2, text: '60 km/h' }, { index: 3, text: '65 km/h' }], correct_answer: 2, explanation: 'Speed = distance/time = 240/4 = 60 km/h.', difficulty: 'easy', tags: ['speed'] },
    { subject_id: karith._id, question_text: 'If x : y = 4 : 5 and y = 25, then x = ?', options: [{ index: 0, text: '18' }, { index: 1, text: '20' }, { index: 2, text: '22' }, { index: 3, text: '24' }], correct_answer: 1, explanation: 'From 4:5, if 5 parts = 25 then 1 part = 5, so x = 4 parts = 20.', difficulty: 'medium', tags: ['ratio-proportion'] },
  ];

  await Question.insertMany(nasuQuestions.map(q => ({ ...q, exam_id: nasu._id, is_active: true })));
  await Question.insertMany(kharidarQuestions.map(q => ({ ...q, exam_id: kharidar._id, is_active: true })));

  await Subject.findByIdAndUpdate(ngk._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(nnep._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(neng._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(narith._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(ncomp._id, { question_count: 8 });

  await Subject.findByIdAndUpdate(kgk._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(knep._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(keng._id, { question_count: 8 });
  await Subject.findByIdAndUpdate(karith._id, { question_count: 8 });

  await MockTest.create({
    exam_id: nasu._id, title: 'Nab Suchak Balanced Mock Test #1', slug: 'nasu-mock-1',
    duration_minutes: 120, total_questions: 40, total_marks: 40, negative_marking: 0.25,
    config: {
      auto_generate: true,
      subject_distribution: [
        { subject_id: ngk._id, count: 12, difficulty_split: { easy: 50, medium: 35, hard: 15 } },
        { subject_id: nnep._id, count: 8, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
        { subject_id: neng._id, count: 8, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
        { subject_id: narith._id, count: 6, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: ncomp._id, count: 6, difficulty_split: { easy: 55, medium: 35, hard: 10 } },
      ],
    },
    is_active: true,
  });

  await MockTest.create({
    exam_id: nasu._id, title: 'Nab Suchak Balanced Mock Test #2', slug: 'nasu-mock-2',
    duration_minutes: 120, total_questions: 40, total_marks: 40, negative_marking: 0.25,
    config: {
      auto_generate: true,
      subject_distribution: [
        { subject_id: ngk._id, count: 12, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        { subject_id: nnep._id, count: 8, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
        { subject_id: neng._id, count: 8, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
        { subject_id: narith._id, count: 6, difficulty_split: { easy: 30, medium: 45, hard: 25 } },
        { subject_id: ncomp._id, count: 6, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
      ],
    },
    is_active: true,
  });

  await MockTest.create({
    exam_id: kharidar._id, title: 'Kharidar Balanced Mock Test #1', slug: 'kharidar-mock-1',
    duration_minutes: 90, total_questions: 32, total_marks: 48, negative_marking: 0.25,
    config: {
      auto_generate: true,
      subject_distribution: [
        { subject_id: kgk._id, count: 11, difficulty_split: { easy: 45, medium: 40, hard: 15 } },
        { subject_id: knep._id, count: 8, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
        { subject_id: keng._id, count: 6, difficulty_split: { easy: 40, medium: 45, hard: 15 } },
        { subject_id: karith._id, count: 7, difficulty_split: { easy: 35, medium: 45, hard: 20 } },
      ],
    },
    is_active: true,
  });

  console.log(`✓ Exam: ${nasu.name}`);
  console.log(`✓ Subjects: ${nasuSubjects.map(s => s.name).join(', ')}`);
  console.log(`✓ Questions: ${nasuQuestions.length}`);
  console.log('✓ Mock Tests: Nab Suchak Balanced Mock Test #1, Nab Suchak Balanced Mock Test #2');

  console.log(`✓ Exam: ${kharidar.name}`);
  console.log(`✓ Subjects: ${kharidarSubjects.map(s => s.name).join(', ')}`);
  console.log(`✓ Questions: ${kharidarQuestions.length}`);
  console.log('✓ Mock Test: Kharidar Balanced Mock Test #1');
  await ensureTextIndexes();
  console.log('✓ Text indexes ensured (questions, exams)');

  console.log('\\n🎉 Seed complete! Run: npm run dev');
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
