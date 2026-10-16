/* Every graded claim on the page. rules: 'health' uses the five BONES tiers; 'data' is for records and
   reference figures; 'history' for things that happened. t: '1'..'5', or 'u' for never properly tested. */
const REVIEWED = 'Sources checked 16 Oct 2026 · Grade proposed by BONES';
const TIERS = {
  health: { 1: 'Replicated', 2: 'Single trial or meta-analysis', 3: 'Observational', 4: 'Contested', 5: 'Debunked', u: 'Untested' },
  history: { 1: 'Strong', 2: 'Moderate', 3: 'Observational', 4: 'Contested', 5: 'Not supported', u: 'Untested' },
  data: { 1: 'Official record', 2: 'One solid source', 3: 'Estimate', 4: 'Disputed', 5: 'Contradicted', u: 'Untested' }
};
const RULES = {
  health: 'Health claims use the five BONES tiers: T1 replicated by independent, well-run studies; T2 one strong trial or a pooled analysis; T3 a pattern in large groups that shows a link, not a cause; T4 credible evidence points both ways; T5 tested properly and failed. Untested means nobody has run a proper test.',
  history: 'History can’t be run as a trial, so these claims use BONES’ history rules: T1 many independent sources agree; T2 one solid source or a well-documented account; T3 the pattern is real but the reason given is an educated guess; T4 credible accounts disagree; T5 the evidence points the other way.',
  data: 'Rules, reference values and measurements aren’t effects to test, so they use the same five steps worded for records: T1 an official rule or reference, or a figure measured the same way again and again; T2 one solid source, such as a careful study or a national body; T3 an estimate or model; T4 credible sources disagree; T5 better data contradicts it.'
};
const MOMMA = ['Momma et al. 2022. Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis of cohort studies. British Journal of Sports Medicine', 'https://bjsm.bmj.com/content/56/13/755'];
const PALUCH = ['Paluch et al. 2022. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9289978'];
const DING = ['Ding et al. 2025. Daily steps and health outcomes in adults: a systematic review and dose-response meta-analysis. Lancet Public Health', 'https://pubmed.ncbi.nlm.nih.gov/40713949/'];
const DING_NEWS = ['University of Sydney summary: rethink the 10,000-a-day step goal (2025)', 'https://www.sydney.edu.au/news-opinion/news/2025/07/24/rethink-the-10000-a-day-step-goal-study-suggests.html'];
const LAUERSEN = ['Lauersen, Bertelsen and Andersen 2014. The effectiveness of exercise interventions to prevent sports injuries: a systematic review and meta-analysis of randomised controlled trials. British Journal of Sports Medicine', 'https://bjsm.bmj.com/content/48/11/871'];
const LIFTMOR = ['Watson et al. 2018. High-intensity resistance and impact training improves bone mineral density and physical function in postmenopausal women with osteopenia and osteoporosis: the LIFTMOR randomized controlled trial. Journal of Bone and Mineral Research', 'https://academic.oup.com/jbmr/article/33/2/211/7605709'];
const SEYNNES = ['Seynnes, de Boer and Narici 2007. Early skeletal muscle hypertrophy and architectural changes in response to high-intensity resistance training. Journal of Applied Physiology', 'https://pubmed.ncbi.nlm.nih.gov/17053104/'];
const BHOF = ['Bone Health & Osteoporosis Foundation: Bone basics', 'https://www.bonehealthandosteoporosis.org/?p=2926'];
const PONTZER = ['Pontzer et al. 2012. Hunter-gatherer energetics and human obesity. PLOS ONE', 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0040503'];

const CLAIMS = {
  /* ---------- 01 How little ---------- */
  'h-jcurve': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Systematic review and dose-response meta-analysis of 16 prospective cohort studies',
    text: 'About 30 to 60 minutes a week of muscle-strengthening activity was linked to the lowest risk of death from all causes, heart disease and cancer, roughly 10 to 20% lower than none. The lowest point for death from any cause was about 40 minutes a week.',
    why: 'Large, consistent cohort data, but people chose how much to lift. Lifters may differ in ways the studies couldn’t fully adjust for, so this shows a link, not proof that lifting caused the drop.',
    src: [MOMMA] },
  'h-jcurve-high': { rules: 'health', t: '4', ctype: 'ASSOC', design: 'The high end of the same dose-response curve',
    text: 'Past about 130 to 140 minutes a week of strength work, the curve bends back toward no benefit. Whether that upturn is real is unclear.',
    why: 'Few people in the studies lifted that much, so the estimate there is wide. The review itself calls the effect of higher volumes unclear. It could be real, or an artifact of who lifts that much.',
    src: [MOMMA] },
  'h-combined': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Pooled cohort data from the same review',
    text: 'People who did both muscle-strengthening and aerobic activity had about 40% lower risk of death than people who did neither (relative risk 0.60).',
    why: 'Observational and consistent, with the same limits as any cohort comparison.',
    src: [MOMMA] },
  'h-steps-q': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Meta-analysis of 15 cohorts, 47,471 adults followed about 7 years, steps measured by device',
    text: 'Compared with the least active quarter (about 3,500 steps a day), the next groups had 40%, 45% and 53% lower risk of death (about 5,800, 7,800 and 10,900 steps).',
    why: 'Steps were measured with devices rather than recalled, which is a strength. People weren’t assigned their steps, so it remains a link rather than proof of cause.',
    src: [PALUCH] },
  'h-steps-age': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Dose-response curves from the same 15-cohort meta-analysis',
    text: 'Risk stopped falling at about 6,000 to 8,000 steps a day for adults 60 and over, and about 8,000 to 10,000 for younger adults.',
    why: 'A consistent pattern across many cohorts, but the leveling-off points are estimates from curve fitting, not hard thresholds.',
    src: [PALUCH] },
  'h-ding': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Systematic review and dose-response meta-analysis of 57 studies',
    text: 'Compared with 2,000 steps a day, 7,000 steps was linked to 47% lower risk of death, nearly the same as 10,000. Past about 7,000, the extra benefit for most outcomes was modest.',
    why: 'A large, recent pooled analysis of observational studies. Strong on the shape of the curve, but it can’t prove the steps caused the difference.',
    src: [DING, DING_NEWS] },
  'h-who': { rules: 'data', t: '1', ctype: 'STATUS', design: 'International guideline',
    text: 'WHO asks adults for 150 to 300 minutes of moderate or 75 to 150 minutes of vigorous activity a week, plus muscle-strengthening on two or more days. Adults over 65 add balance and strength work on three or more days.',
    why: 'This is the official recommendation itself, so it is graded as a record. The evidence behind it is a mix of trials and cohorts.',
    src: [['WHO guidelines on physical activity and sedentary behaviour (2020)', 'https://www.who.int/publications/i/item/9789240015128'], ['University of Sydney summary of the 2020 guidelines', 'https://www.sydney.edu.au/news-opinion/news/2020/11/26/new-global-guidelines-on-physical-activity-and-sedentary-behavio.html']] },

  /* ---------- 02 Load ---------- */
  'b-mechano': { rules: 'health', t: '1', ctype: 'EFFECT', design: 'Decades of animal loading experiments, disuse studies and human studies',
    text: 'Bone adapts to the strain it gets. Strain above its usual set point triggers new bone; strain below it triggers bone removal.',
    why: 'Shown again and again by independent groups with different methods: loading one limb in animals, paralysis and bed-rest studies, spaceflight, and athletes’ limbs. This feedback loop is known as the mechanostat.',
    src: [['Meakin, Price and Lanyon 2014. The contribution of experimental in vivo models to understanding the mechanisms of adaptation to mechanical loading in bone. Frontiers in Endocrinology', 'https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2014.00154/full']] },
  'b-remodel': { rules: 'data', t: '1', ctype: 'MEASURE', design: 'Bone biology, measured repeatedly',
    text: 'One remodeling cycle, where old bone is dissolved and new bone laid down in its place, takes about 3 to 6 months.',
    why: 'A standard figure from bone histology, consistent across textbooks and reviews.',
    src: [['Hardy and Fernandez-Patron 2020. Destroy to rebuild: the connection between bone tissue remodeling and matrix metalloproteinases. Frontiers in Physiology', 'https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2020.00047/full']] },
  'b-space': { rules: 'data', t: '1', ctype: 'MEASURE', design: 'Bone scans of astronauts before and after long missions',
    text: 'On four-to-six-month missions, astronauts lose on average about 1 to 1.5% of their bone density per month. The hip loses faster than the spine.',
    why: 'Measured the same way across many crews by NASA and independent researchers.',
    src: [['NASA: Risk of spaceflight-induced bone changes', 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/'], ['Lang et al. 2004. Cortical and trabecular bone mineral loss from the spine and hip in long-duration spaceflight. Journal of Bone and Mineral Research', 'https://pubmed.ncbi.nlm.nih.gov/15125798/']] },
  'b-pitchers': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Cross-sectional study of 103 professional baseball players, comparing each player’s throwing arm with his other arm, plus 94 controls',
    text: 'Throwing nearly doubled the strength of the upper-arm bone in the throwing arm. In players who had stopped throwing more than 50 years earlier, about half of the extra size and a third of the extra strength remained.',
    why: 'Comparing the two arms of the same person removes genes, diet and hormones from the picture, which makes this unusually clean evidence. It is one well-run study rather than many.',
    src: [['Warden et al. 2014. Physical activity when young provides lifelong benefits to cortical bone size and strength in men. PNAS', 'https://doi.org/10.1073/pnas.1321605111']] },
  'b-liftmor': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Randomized controlled trial, 101 women with low bone mass, 8 months',
    text: 'Twice-weekly, 30-minute supervised sessions of heavy lifting (5 sets of 5 at over 85% of max) plus impact work raised spine bone density by about 2.9%, while a gentle home program lost about 1.2%. Hip density and physical function also favored the heavy group.',
    why: 'Random assignment means the training can be credited with the difference. It is one trial in one population, so it is not yet replicated widely. The only adverse event was a minor back spasm.',
    src: [LIFTMOR] },
  'b-neural': { rules: 'health', t: '2', ctype: 'MEASURE', design: 'Training study, 35 days, three sessions a week',
    text: 'After 35 days of training, leg strength rose about 39% while the muscle’s cross-section grew about 7%.',
    why: 'A careful lab study with scans at several points. The gap between strength and size is the classic sign that early gains are largely the nervous system learning to use the muscle.',
    src: [SEYNNES] },
  'b-muscle': { rules: 'health', t: '2', ctype: 'MEASURE', design: 'Same training study, MRI at day 20 and day 35',
    text: 'Muscle growth was measurable after about 20 days of hard training (about 3.5 to 5%).',
    why: 'Directly measured by MRI. Some of the earliest increase in other studies is swelling rather than new muscle, so treat the first weeks as a start, not the finish.',
    src: [SEYNNES] },
  'b-tendon': { rules: 'health', t: '2', ctype: 'MEASURE', design: 'Review of human tendon loading studies',
    text: 'Tendon stiffness changes over weeks to months of loading. Tendon size changes over months to years.',
    why: 'A consistent picture across human studies, summarized in a review by leading tendon researchers. The exact time course varies by tendon and person.',
    src: [['Heinemeier and Kjaer. In vivo investigation of tendon responses to mechanical loading. Journal of Musculoskeletal and Neuronal Interactions', 'https://www.ismni.org/jmni/article/11/115']] },
  'b-peak': { rules: 'data', t: '2', ctype: 'MEASURE', design: 'National bone-health foundation summary',
    text: 'Peak bone mass is usually reached between the ages of 18 and 25.',
    why: 'A widely used reference range. Other sources put it as late as about 30, so the exact age varies.',
    src: [BHOF] },
  'b-meno': { rules: 'data', t: '2', ctype: 'MEASURE', design: 'National bone-health foundation summary',
    text: 'In the five to seven years after menopause, women can lose up to 20% or more of their bone density.',
    why: 'A widely cited upper range. Individual losses vary a lot.',
    src: [BHOF] },
  'b-sarco': { rules: 'data', t: '3', ctype: 'MEASURE', design: 'Estimate reported by Harvard Health Publishing',
    text: 'After about 30, men can lose as much as 3 to 5% of their muscle mass per decade.',
    why: 'An estimate summarized from studies of aging muscle. The rate depends heavily on activity, so it is graded as an estimate.',
    src: [['Harvard Men’s Health Watch: Declining muscle mass is part of aging, but not inevitable', 'https://www.health.harvard.edu/press_releases/declining-muscle-mass-is-part-of-aging-but-not-inevitable-from-the-march-2016-harvard-mens-health-watch']] },

  /* ---------- 03 Lifts ---------- */
  'l-mindose': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Systematic reviews of training studies in resistance-trained adults',
    text: 'One set of 6 to 12 reps close to failure, two to three times a week for 8 to 12 weeks, raised squat and bench strength in people who already lifted. More sets raised it more.',
    why: 'Pooled training studies. Most were in trained young men, so the exact numbers may differ for beginners, who usually gain faster.',
    src: [['Androulakis-Korakakis et al. 2021. The minimum effective training dose required for 1RM strength in powerlifters. Frontiers in Sports and Active Living (summarizes the authors’ earlier review)', 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.713655/full']] },
  'l-load': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Systematic review and meta-analysis of training studies',
    text: 'When sets were taken close to failure, light and heavy loads built similar muscle (about 7% and 8% growth). Heavy loads built more maximum strength (about 35% versus 28%).',
    why: 'Pooled randomized training studies. The muscle result held across studies; the strength edge for heavy loads was consistent.',
    src: [['Schoenfeld, Grgic, Ogborn and Krieger 2017. Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. Journal of Strength and Conditioning Research', 'https://doi.org/10.1519/JSC.0000000000002200']] },
  'l-grip': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Prospective cohort, 139,691 adults in 17 countries, about 4 years',
    text: 'Each 5 kg lower grip strength was linked to 16% higher risk of death from any cause. Grip predicted death better than systolic blood pressure.',
    why: 'A very large international cohort. Grip is a marker of overall strength and health, so this is a link, not evidence that squeezing things makes you live longer.',
    src: [['Leong et al. 2015. Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study. The Lancet', 'https://pubmed.ncbi.nlm.nih.gov/25982160/'], ['Healio summary', 'https://www.healio.com/news/cardiology/20150821/grip-strength-may-predict-risk-for-mortality-cvd']] },

  /* ---------- 04 Walking ---------- */
  'w-manpo': { rules: 'history', t: '2', ctype: 'STATUS', design: 'Well-documented marketing history',
    text: 'The 10,000-step goal began as the name of a Japanese pedometer, the manpo-kei (“10,000-step meter”), sold after the 1964 Tokyo Olympics.',
    why: 'Consistently reported by researchers and journalists. The number came before the evidence, not from it.',
    src: [['ScienceAlert: Do you really need to take 10,000 steps per day?', 'https://www.sciencealert.com/do-you-really-need-to-take-10-000-steps-per-day'], DING_NEWS] },
  'w-saint': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'US national cohort, about 4,800 adults 40 and over, steps measured by accelerometer',
    text: 'Compared with 4,000 steps a day, 8,000 steps was linked to 51% lower risk of death, and 12,000 to 65% lower.',
    why: 'Device-measured steps in a national sample. Observational, so a link rather than proof.',
    src: [['National Cancer Institute: Higher daily step count linked with lower all-cause mortality (Saint-Maurice et al. 2020, JAMA)', 'https://www.cancer.gov/news-events/press-releases/2020/daily-step-count-mortality']] },
  'w-cadence': { rules: 'data', t: '2', ctype: 'MEASURE', design: 'Narrative review of lab and field studies',
    text: 'About 100 steps a minute is a reasonable rule of thumb for moderate-intensity walking in healthy adults. About 130 may mark vigorous.',
    why: 'The authors call it a heuristic, a practical estimate rather than a precise cutoff. It varies with height, fitness and age.',
    src: [['Tudor-Locke et al. 2018. How fast is fast enough? Walking cadence (steps/min) as a practical estimate of intensity in adults. British Journal of Sports Medicine', 'https://bjsm.bmj.com/content/52/12/776']] },
  'w-intensity': { rules: 'health', t: '4', ctype: 'ASSOC', design: 'Two large step studies with conflicting results',
    text: 'Whether walking faster adds benefit beyond the total number of steps is unsettled.',
    why: 'In one US cohort, step pace showed no link with death once total steps were counted. In the 15-cohort meta-analysis, a faster best half hour was linked to lower risk, but other pace measures were not.',
    src: [['National Cancer Institute summary of Saint-Maurice et al. 2020', 'https://www.cancer.gov/news-events/press-releases/2020/daily-step-count-mortality'], PALUCH] },
  'w-hadza': { rules: 'data', t: '2', ctype: 'MEASURE', design: 'GPS tracking of Hadza hunter-gatherers, Tanzania',
    text: 'Hadza men walked about 11.4 km a day and women about 5.8 km.',
    why: 'Directly measured with GPS in one careful field study. One population, so not the whole human range.',
    src: [PONTZER] },
  'w-hadza-energy': { rules: 'health', t: '2', ctype: 'MEASURE', design: 'Doubly labeled water measurements of daily energy use',
    text: 'Despite being more active, the Hadza burned about the same total energy per day as Westerners, once body size was accounted for.',
    why: 'Measured with the gold-standard method for daily energy use. The finding has since been repeated in other groups, but what it means for weight loss is still argued.',
    src: [PONTZER] },

  /* ---------- 05 Mobility ---------- */
  'r-rom': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Systematic review and meta-analysis of 11 studies, 452 participants',
    text: 'Strength training through a full range improved flexibility about as much as stretching did.',
    why: 'Head-to-head trials, pooled. The studies varied a lot in how they were run, but they pointed the same way.',
    src: [['Afonso et al. 2021. Strength training versus stretching for improving range of motion: a systematic review and meta-analysis. Healthcare', 'https://estudogeral.uc.pt/handle/10316/104612']] },
  'r-injury': { rules: 'health', t: '2', ctype: 'EFFECT', design: 'Meta-analysis of 25 randomized trials, 26,610 participants',
    text: 'Strength training cut sports injuries to about a third (relative risk 0.32). Stretching made no clear difference (0.96).',
    why: 'Pooled randomized trials, so this can speak to cause. The strength estimate came from fewer trials than the stretching one, so its exact size is less certain.',
    src: [LAUERSEN] },
  'r-falls': { rules: 'health', t: '1', ctype: 'EFFECT', design: 'Cochrane review of 108 randomized trials, 23,407 people',
    text: 'In older adults living at home, exercise cut the rate of falls by about 23%. Programs built mainly on balance and functional exercises had high-certainty evidence.',
    why: 'Many independent randomized trials, pooled by Cochrane and rated high certainty. This is about as strong as exercise evidence gets.',
    src: [['Sherrington et al. 2019. Exercise for preventing falls in older people living in the community. Cochrane Database of Systematic Reviews (Cochrane news summary)', 'https://www.cochrane.org/about-us/news/new-cochrane-review-assesses-benefits-and-harms-exercise-preventing-falls-older-people-living']] },
  'r-sitrise': { rules: 'health', t: '3', ctype: 'ASSOC', design: 'Cohort of 2,002 adults aged 51 to 80, followed about 6 years',
    text: 'Each extra point on the sit-to-rise test was linked to 21% lower risk of death. The lowest scorers had five to six times the risk of the highest.',
    why: 'One clinic cohort in Brazil, adjusted for age, sex and weight. The test reflects overall strength, balance and flexibility, so the score is a marker, not a cause.',
    src: [['Brito et al. 2012. Ability to sit and rise from the floor as a predictor of all-cause mortality. European Journal of Preventive Cardiology (ScienceDaily summary)', 'https://www.sciencedaily.com/releases/2012/12/121213085202.htm']] }
};
