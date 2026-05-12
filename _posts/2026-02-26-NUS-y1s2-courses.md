---
title: NUS Y1S2 AY25/26 Course Review
date: 2026-02-26 00:00:00 +0800
categories: [nus-course-review, y1s2]
tags: [nus, course, review, y1s2, cs2100, cs2109s, cs3230, cs3233, is1108, ma2213, st2334, cfg1002]
description: A review of my Year 1 Semester 2 AY25/26 courses at NUS (Computer Science, second major in Statistics).
authors: [marvinthang]
layout: post
toc: true
toc_sticky: true
math: true
---


| Module Code                                                                                       | Module Title                            | MCs |
| ------------------------------------------------------------------------------------------------- | --------------------------------------- | --- |
| [CS2100](https://nusmods.com/courses/CS2100/computer-organisation)                                | Computer Organisation                   | 4   |
| [CS2109S](https://nusmods.com/courses/CS2109S/introduction-to-ai-and-machine-learning)            | Introduction to AI and Machine Learning | 4   |
| [CS3230](https://nusmods.com/courses/CS3230/design-and-analysis-of-algorithms)                    | Design and Analysis of Algorithms       | 4   |
| [CS3233](https://nusmods.com/courses/CS3233/competitive-programming)                              | Competitive Programming                 | 4   |
| [IS1108](https://nusmods.com/courses/IS1108/digital-and-ai-ethics)                                | Digital and AI Ethics                   | 4   |
| [MA2213](https://nusmods.com/courses/MA2213/introduction-to-statistics-and-statistical-computing) | Numerical Analysis I                    | 4   |
| [ST2334](https://nusmods.com/courses/ST2334/probability-and-statistics)                           | Probability and Statistics              | 4   |
| [CFG1002](https://nusmods.com/courses/CFG1002/career-catalyst)                                    | Career Catalyst                         | 2   |

## CS2100 - Computer Organisation

**Lecturers**: Aaron Tan, Prabhu Natarajan  
**TA**: Toh Yi Zhong  
**Lab TA**: Chen Xiangyun

[Course Website](https://www.comp.nus.edu.sg/~cs2100/)

### Grading Scheme

| Component            | Weight | Max | Mean  | Quartiles                     | marvinthang | Score (%) |
| -------------------- | ------ | --- | ----- | ----------------------------- | ----------- | --------- |
| Tutorial  Attendance | 5%     | 10  | 9.51  | 0 / 10 / 10 / 10 / 10         | 10          | 5%        |
| Quizzes              | 3%     | 3   | 2.71  | 0 / 3 / 3 / 3 / 3             | 3           | 3%        |
| Labs                 | 10%    | 185 | 176.3 | 0 / 181.5 / 183.5 / 185 / 185 | 184.5       | 9.97%     |
| Assignment 1         | 4%     | 40  | 36.4  | 0 / 35.5 / 37.5 / 39 / 40     | 40          | 4%        |
| Assignment 2         | 4%     | 40  | 34.88 | 0 / 33.88 / 36 / 38 / 40      | 40          | 4%        |
| Assignment 3         | 4%     | 20  | 18.54 | 0 / 18.88 / 20 / 20 / 20      | 20          | 4%        |
| Mid-term             | 20%    | 40  | 20.31 | 4 / 15 / 20 / 25 / 38         | 38          | 19%       |
| Final                | 50%    | 100 | ?     | ?                             | 98.5        | 49.25%    |

**Total:** 98.22%  
**Expected Grade:** A+

### tl;dr

* **The Good**: A fascinating BFS survey that successfully bridges the gap between high-level software and physical hardware.
* **The Bad**: The exams do not test deep conceptual understanding; they test your ability to act as a human calculator fast and accurately under time pressure.
* **The Ugly**: One tiny calculation error in a MIPS decoding question will cascade and cost you all subsequent marks. Also, official PYP answers are strictly gatekept by the teaching staff.

### Content

The course content is broad, but it does not go very deep. It feels more like a survey of many low-level computer systems concepts:
- C Programming
- Data Representation and Number Systems
- MIPS Assembly
- Instruction Set Architecture
- Processor Datapath and Control
- Boolean Algebra and Logic Circuits
- Combinational and Sequential Logic
- Pipelining
- Cache

### Teaching Format and Assessment
#### Lectures / Recitations

This mod is taught in **Blended Learning** mode. Basically, you are expected to watch prerecorded lecture videos and do weekly quizzes online. 

The actual lecture slot is called a **recitation**. From what I heard, the lecturers use it to recap the main points from the videos and answer questions. I never attended any recitation, so I cannot comment much on that. The recitations are recorded anyway.

For me, reading the slides and watching the videos was enough. The slides were usually clear, and when they were not, the videos explained things quite well. The prerecorded videos are extremely long though (some weeks may have 3-4 hours of video), so you can probably skip the easier parts or watch them at 2x speed. Overall, I think this format saved me quite a lot of time.

#### Quizzes (3%)

There are weekly quizzes on Canvas. They are quite easy and straightforward, but they are still useful for recalling the main points from the lectures.

#### Tutorials (5%)

I highly recommend doing the tutorials. They are not too hard, but they helped me understand the material much better. 

The tutorial questions are also quite similar in style to the midterm and final questions, so doing them is probably one of the best ways to prepare for exams. The detailed solutions are very helpful too.

#### Labs (10%)

> You are to complete your lab assignment and submit it by hand to your tutor by the end of each lab session, unless otherwise stated.

The labs were not relevant to the exams at all, so I did not put much effort into them. It is basically about how to use QtSpim for the MIPS simulator, wire physical circuits, and use Logisim for digital logic design. You can probably just follow the lab manual and do the minimum to get full marks. 

Most labs were basically: finish the lab assignment before the session, show your result to the lab TA, submit it, and leave after 5 minutes. There were only 3 practical labs where you actually had to build circuits on-site.

**Tip:** Pick a lab slot right after your tutorial, because they are usually in adjacent rooms. You can finish the tutorial, submit your lab immediately, and go home.

#### Assignments (12%)

There were 3 assignments. They were quite straightforward, but still had a decent amount of work. I spent around 1 hour on each and got full marks. Remember to double-check your answers carefully, because some questions are a bit tricky and it is easy to lose marks from small mistakes.

#### Midterm (20%)

**Format**: 
- Pen-and-paper, open-book (1.5 hours)
- MCQs (20 marks) and FITBs (20 marks)

**Scope**: Everything covered up to and including Processor Datapath and Control

**Materials**: Any printed materials, Calculator

Similar to the PYPs, the midterm mostly tests your ability to work like a computer: do calculations by hand quickly and flawlessly. 

Luckily, I am quite good at that, so I did not find the midterm too hard. The main challenge is being careful because there are many small calculations, and one tiny mistake can destroy your answer.

The midterm was a bit longer than I expected from the PYPs, but I still had some time to double-check. The MCQs required quite a good understanding of the content and were harder than the PYPs.

One thing I did not like was that they tested some C concepts that did not really appear clearly in the course itself. If I were not already familiar with C, I might have gotten almost all the C questions wrong.

**Tips for the midterm:** Prepare your cheatsheet carefully. Include tables for register/instruction code in binary, ALU signals, and anything involving conversions. Also learn how to use n-base mode on your calculator properly.

#### Final Exam (50%)

**Format**:
- Pen-and-paper, open-book (2 hours)
- 17 MCQs (34 marks) and 6 multi-part questions (66 marks)

**Scope**: Earlier topics (~30%), Later topics (~70%)

**Materials**: Any printed materials, Calculator

Similar to the midterm, I felt the final was much harder than the PYPs, but I actually enjoyed it quite a lot. 

The FITB questions were quite standard. However, around 40% of the paper was based on one MIPS code question, so if you misread the code, you could lose a lot of marks very quickly. Luckily, I did not mess that one up.

I lost 0.5 marks because my rewritten C code was too similar to the MIPS logic, using something like `if (temp < 0) temp = -temp` instead of a cleaner `temp = abs(...)`. I also carelessly read one part incorrectly. If not, I might have gotten a perfect score :<

There was also a hard code conversion question that I almost got wrong, but somehow survived. They also tested the static-0 hazard, which I almost forgot existed. I just filled in something that looked correct and somehow it was correct.

he marking is quite fast; they release the results after 5 days, but it could be even faster using Examplify. I don't see why they do not use it anymore. I think it would be better to give physical papers and type the answers into an Examplify box, so that the marking could be done in one night.

Also, I don't know why they do not release the PYP solutions. Even though you can find them on the internet or just ask seniors or TAs to send them to you, the teaching staff still state they don't have them.

**Tips for the final:** The paper is quite long, so you may not have time to double-check everything. Do each question carefully the first time. Prepare scratch paper for K-maps, flip-flop sequential circuits, and pipelining delay tables. That helped me a lot during the exam.

### Overall Thoughts

Workload: 6/10  
Enjoyability: 7/10  
Difficulty: 3/10

CS2100 is a mod that bridges the gap between software and hardware. It gave me my first understanding of low-level design and how the software I write in high-level languages like Python and C++ actually gets executed on the hardware with the same abstraction.

The course content is quite heavy and broad. I still had to spend a lot of time processing the slides, doing quizzes and tutorials by myself, and completing assignments, even though I skipped the prerecorded lectures and recitations.

This was probably the mod I spent the most time on this semester, partly because I was genuinely interested in computer design: how processors work, how they execute instructions, and how low-level hardware optimisations work.

However, the module is definitely more BFS than DFS; it surveys many concepts to give you a rough mental model rather than diving deeply into any single one.

While the concepts themselves aren't conceptually difficult, I really disliked how the exams force you to behave like a human computer. They mostly test your ability to execute mechanical calculations like binary conversions, MIPS tracing, and K-maps flawlessly under extreme time pressure.

### How to Do Well

If you enjoy low-level systems, you will find the material fascinating, but if you hate tedious calculations, the exams will be incredibly frustrating.

To do well, I highly recommend reading the slides at your own pace instead of sitting through hours of lecture videos. Focus your energy on doing the tutorials and assignments seriously, as you can safely put minimal effort into the labs if your main goal is exam prep.

Prepare a solid cheatsheet, bring blank scratch paper for pipelining tables or K-maps, and practice the past year papers relentlessly.

Remember that understanding the theory is only half the battle; the other half is surviving the time limit without making silly mistakes. Be extremely careful during exams, because one tiny error in MIPS decoding will cascade and destroy all your subsequent marks for that question.

*(Note: Because I feel this module relies too heavily on manual calculations, I am building an interactive CS2100 website to help students actively visualize MIPS, datapath control, caching, and pipelining.)*

## CS2109S - Introduction to AI and Machine Learning

**Lecturers**: Muhammad RIZKI Maulana, CONGHUI Hu, PATRICK Rebentrost  
**TA**: Beh Chuen Yang (N00bcak)

### Grading Scheme

| Component        | Weight | Max | Mean  | Quartiles                    | marvinthang | Score  |
| ---------------- | ------ | --- | ----- | ---------------------------- | ----------- | ------ |
| Coursemology     | 30%    | 30  | 29.6  | 7 / 30 / 30 / 30 / 30        | 30          | 30%    |
| Capstone Project | 10%    | 100 | 81.55 | 0 / 73 / 99 / 100 / 100      | 100         | 10%    |
| Midterm          | 30%    | 100 | 62.74 | 10.5 / 54 / 64.5 / 72.5 / 97 | 70          | 21%    |
| Final            | 30%    | 100 | 70.61 | 17 / 63 / 72.25 / 82 / 97.5  | 97.5        | 29.25% |

**Total:** 90.25%  
**Expected Grade:** A+

### Content

- "Classical" AI (Search)
  - **Uninformed Search:**
    - Breadth-First Search (BFS)
    - Depth-First Search (DFS)
    - Depth-Limited Search (DLS)
    - Iterative Deepening Search (IDS)
    - Uniform-Cost Search (UCS)
  - **Informed Search:**
    - A* Search
    - Heuristic functions (Admissibility, Consistency)
  - **Local Search:**
    - Hill-Climbing
  - **Adversarial Search:**
    - Minimax Algorithm
    - Alpha-Beta Pruning
- "Classical" Machine Learning
  - **Decision Trees**
  - **Regression:**
    - Linear Regression
    - Logistic Regression
    - Gradient Descent
    - Normal Equation for solving linear regression
  - **Regularization:**
    - L1 Regularization (Lasso Regression)
    - L2 Regularization (Ridge Regression)
  - **Kernel Methods:**
      - Dual formulation of ML
      - Kernel Methods for non-linear data
  - **Neural Networks:**
    - Multi-Layer Neural Networks (MLNN)
    - Backpropagation
- "Modern" Machine Learning:
  - **Deep learning:**
      - Convolutional Neural Networks (CNN)
      - Recurrent Neural Networks (RNN)
      - Attention Mechanisms
      - Transformers
  - **Unsupervised (deep) learning**

### Lecture

Lectures are recorded and made available on Panopto.

### Coursemology

The Coursemology component is determined by the level achieved in Coursemology, which is based on the experience points (EXP) earned. EXP can be gained through various activities, including:

- Attending and participating in lectures (150 EXP)
- 10 Tutorial attendance (800 EXP) + participation (200 EXP)
- Completing 4 problem sets (4200 EXP each)
- Completing 12 lecture trainings (500 EXP + 150 Early Bird EXP each)
- Problem set, Midterm Survey (900 EXP total)

This is capped at 30,000 EXP, which corresponds to Level 30, and is scaled to 30% of your overall grade.

You only need to do all 4 problem sets, complete all surveys, do all lecture trainings, then you only need to attend 5 tutorial (try to get participation marks in those 5 tutorials) to get the maximum 30 marks for this component.

### Capstone Project

You will be presented with a problem, and your task is to develop a solution. Grading will primarily be based on how your solution performs. This is designed to encourage exploration and experimentation.

![Desktop View](/assets/img/posts/y1s2/CS2109S-capstone.png){: width="972" height="589" }
_CS2109S Capstone Project Score Distribution_

### Midterm

**Format:**
- Digital Assessment (Examplify)
- **Duration:** 20 hours
- 30 questions, including MCQ/MRQ/FITB/TF

**Scope:** All topics covered until and including Lecture 6

**Materials:**
- One double-sided A4 help sheet
- Calculator

Nothing much to say, I did make-up midterm, that was terrible.

![Desktop View](/assets/img/posts/y1s2/CS2109S-midterm.png){: width="972" height="589" }
_(Old) CS2109S Midterm Score Distribution_

### Final Exam

**Format**: 
- Digital Assessment (Examplify)
- **Duration**: 2 hours
- 32 questions, including MCQ/MRQ/FITB/TF

**Materials**:
- One A4 cheatsheet, both sides
- Calculator

$>$ 90% will be on machine learning

There is 1 available cheatsheet on examplify, you maybe don't need your printed cheatsheet, but yeh with your own cheatsheet, it maybe faster to find the relevant formula or concept, so i would still recommend preparing a printed cheatsheet.

![Desktop View](/assets/img/posts/y1s2/CS2109S-final.png){: width="972" height="589" }
_CS2109S Final Exam Score Distribution_

## CS3230 - Design and Analysis of Algorithms

**Lecturers**: Chen Yu, Sanjay Jain, Warut Suksompong  
**TA**: Yeung Man Tsung (Benson)

### Grading Scheme

| Component      | Weight | Max | Mean  | Quartiles                  | marvinthang | Score |
| -------------- | ------ | --- | ----- | -------------------------- | ----------- | ----- |
| Tutorials      | 5%     | 20  | 18.5  | 1 / 20 / 20 / 20 / 20      | 20          | 5%    |
| Assignments    | 25%    | 25  | 24.43 | 0 / 25 / 25 / 25 / 25      | 25          | 25%   |
| Lecture Attend | 2%     | 10  | 7.22  | 0 / 6 / 9 / 10 / 10        | 7           | 1.4%  |
| Midterm        | 30%    | 50  | 27.83 | 0 / 22.5 / 27.25 / 33 / 50 | 48          | 28.8% |
| Final Exam     | 40%    | 60  | 33.69 | 0 / 27 / 34 / 42 / 56      | 54          | 36%   |

**Total:** 96.2%  
**Expected Grade:** A+

### tl;dr

* **The Good**: Teaches a crucial CS skill: turning raw algorithmic intuition into formal, clean mathematical proofs. Also, the teaching team grades exams insanely fast (usually 2-3 days).
* **The Bad**: The assignments are long and challenging. Writing proofs under time pressure can be punishing if you don't know how to keep your arguments concise.
* **The Ugly**: The infamous coin-weighing questions. They can easily drain your time during exams if you try to figure out the absolute optimal solution.

### Content

- Week 1: Asymptotic Analysis
- Week 2: Recurrence and Master Theorem
- Week 3: Proof of Correctness + Divide and Conquer
- Week 4: Sorting Algorithms
  - Lower Bound for Comparison-Based Sorting
  - Average-Case Analysis of Quick Sort
- Week 5: Randomised Algorithms
- Week 6: Dynamic Programming
- Week 7: Greedy Algorithms
- Week 9: Amortised Analysis
- Week 10+12: Reductions & Intractability
  - NP and NP-Complete

### Teaching Format and Assessment

#### Lecture Attendance (Bonus 2%)

> Lecture attendance gives 0.2% per lecture, up to 10 out of 11 lectures. Attendance is claimed by scanning a QR code shown during the lecture break.

The QR code is only available for a short window, usually around 5 minutes, so you need to be around during the break to claim it.

Lectures are recorded and uploaded on Panopto.

I did not attend any lectures. I found that reading the slides was enough, especially if you already have some algorithms background. For me, the assignments and tutorials were much more useful because they explicitly showed the expected way to write proofs.

#### Tutorials (5%)

> Tutorial marks come from **attendance** and **participation**. Each tutorial attended gives 1 mark, for 12 marks total. Participation in two tutorials gives 5 marks each, and everything is capped at 20 marks.

Unlike last semester, you need to attend at least 10 out of 12 tutorials to get the full 20 marks.  
Participation is quite easy to get. You just need to give reasonable, short answers for tutorial questions.

My TA was really good and explained things clearly. The tutorial questions were also useful for understanding the material. Because of that, I found tutorials quite beneficial, even though most of the time I was doing other things during the tutorials.

#### Assignments (25%)

> Your best 7 out of 10 assignments are counted (8 marks each). The raw total is 56 marks, capped at 50 marks.

I found the assignments quite challenging, but they were probably the most useful part of the module as they force you to actually think through the algorithms.

I stopped doing them after Assignment 7 because I already got full marks and wanted to save time for other courses.

#### Midterm (30%)

**Format:** 
- Written Assessment (Pen and Paper)
- **Duration:** 80 mins
- 10 MCQ (2 marks each) = 20 marks
- 3 proof questions = 30 marks total
  - 1st question has 1 part
  - 2nd question has 2 parts
  - 3rd question has 3 parts

**Scope:** All lectures up to Week 5 lecture (inclusive)

**Materials:**
- Open book
- **No calculator**

The MCQs were quite standard and pretty easy.

This sem's midterm focused heavily on proofs of correctness and probability, with no DP or greedy questions like last sem. The proof questions were long, but still manageable.

My main mistake was writing too much detail, which cost me time and meant I only finished about half of the last part. My biggest advice here is to keep your proof answers short, clear, and easy to follow.

The midterm was much easier than the PYPs I looked at. Some PYP questions, especially the coin weighing ones, felt much more challenging. Luckily, this semester’s midterm did not have that.

#### Final Exam (40%)

**Format:**
- Written Assessment (Pen and Paper)
- **Duration:** 2 hours
- 10 MCQ (2 marks each) = 20 marks
- 4 proof questions (10 marks each) = 40 marks

**Materials:**
- Open book
- **No calculator**

The MCQs were quite standard and not very challenging.

The essay questions were also reasonable: one greedy question, one DP question, one NP-completeness proof, and one weighing question. The NP-completeness question was quite guided since it explicitly said to reduce from 3-SAT.

The hardest question was the coin weighing one. I was too lazy to think of the optimal idea, so I wrote a simpler but non-optimal solution.

Learning from my midterm mistake, I wrote shorter answers for the essay questions this time. It helped me finish everything quite early, but I was too lazy to double-check properly. I probably made some answers too short and lost marks due to missing details.

Overall, the final exam was reasonable. If you understood the assignments and tutorials properly, most questions should feel familiar.

### Overall Thoughts

Workload: 3/10  
Enjoyability: 8/10  
Difficulty: 2/10

**Difficulty Disclaimer:** My 2/10 difficulty rating is heavily biased by my competitive programming (CP) background from high school. I had already seen many of the core concepts (DnC, DP, greedy, reductions) before, so the main challenge for me was learning formal proof presentation, rather than discovering the algorithms from scratch. If you do not have strong algorithmic maturity, this module can feel much harder.

Because of this background, I found the concepts straightforward. However, the assignments were still quite long, so I still had to put in a decent amount of actual work to secure my grade.

I really enjoyed the module. It isn't flashy, but it teaches a vital CS skill: turning an algorithmic idea into a clean mathematical argument. In CP, you can often just submit code and pray to the judge. In CS3230, sadly, "it works because it feels right" is not a valid proof.

The course doesn't go extremely deep into rigorous mathematics; it is more of an introduction to reasoning formally about algorithms. The main value is learning how to present arguments properly—proving DP and greedy solutions, analysing time complexity, and finally understanding what people mean when they talk about `P = NP`.

*(Also, a huge shoutout to the teaching team for their incredibly fast exam grading. Even with essay questions, they often released results in 2-3 days. They are likely the fastest graders in NUS, and getting feedback that quickly is amazing.)*

## CS3233 - Competitive Programming

[Course website](https://www.comp.nus.edu.sg/~stevenha/cs3233.html)

[Open the Google Sheet](https://docs.google.com/spreadsheets/d/1NprA9S5GTnIXBcV9YF-VitNcmofvTRCrDOrwCnZzeOw/edit?usp=sharing)

<iframe
  src="https://docs.google.com/spreadsheets/d/1NprA9S5GTnIXBcV9YF-VitNcmofvTRCrDOrwCnZzeOw/htmlview"
  width="100%"
  height="600"
  frameborder="0">
</iframe>

**Total:** 100%  
**Grade:** A+ (joint-1)

## IS1108 - Digital and AI Ethics

**Lecturer**: Lee Boon Kee  
**TA**: Canva Chua Qi Xun

| Component           | Weight | Max | Mean  | Quartiles              | marvinthang | Score |
| ------------------- | ------ | --- | ----- | ---------------------- | ----------- | ----- |
| Class Participation | 10%    | 10  | ?     | ?                      | ?           | ?     |
| Individual Report   | 20%    | 20  | 15    | 0 / 14 / 15 / 16 / 18  | 16          | 16%   |
| Midterm test        | 30%    | 30  | 20.92 | 13 / 20 / 21 / 22 / 24 | 23          | 23%   |
| Group Debate        | 20%    | 20  | 15.96 | 0 / 15 / 16 / 17 / 18  | 15          | 15%   |
| Group Product Pitch | 20%    | 20  | ?     | ?                      | ?           | ?     |

**Total:** ?%  
**Expected Grade:** B

### Key Topics
The following are key topics for this course:

1.    Professional Ethics
2.    AI Ethics and Governance Frameworks
3.    Ethical AI Product Management
4.    Human Machine Interaction and Ethical UX Design
5.    Automation and Autonomous Systems
6.    Data Privacy and Protection
7.    Digital Intellectual Property Rights
8.    Digital Divide, Equity, Accessibility and Inclusion
9.    Digital and AI Ethics by Design
10.  Social Good and Sustainable Digital Practices

### Modes of Teaching and Learning

This course is designed as a blended collaborative digital course to be delivered over two semesters per year. The delivery will consist of the following:

- Online Learning
  - **RWD**: The online asynchronous portion of the course follows a READ-WATCH-and-DO (RWD) model, designed to support self-regulated and flexible learning. Each week, students engage with a variety of content and activities-including reading materials, short video lectures, infographics, curated YouTube clips, and articles for further exploration-followed by hands-on tasks and reflections. This RWD structure ensures that students can absorb foundational concepts and apply them through interactive exercises, all at their own pace, enhancing both understanding and engagement within the blended learning environment.
  - **In-person Lectures**: In addition to online learning, the course features a select number of in-person lectures, including an opening session in Week 1 to introduce key themes, and a series of special lectures scheduled in different weeks, to synthesize learning. These sessions provide valuable opportunities for direct engagement, real-world insights, and interactive discussion, complementing the flexible, scalable online content with meaningful face-to-face experiences.
  - **Group Discussions, Debate and Project Work**
    - **Case Scenarios**: Students are grouped into teams to collaborate on ethics and data privacy problems such as misuse of personal information, irresponsible use of tech / AI, lack of acceptance of responsibility, transparency, accountability, and lack of acknowledgement of others’ work. Students are required to use Miro digital whiteboards for the discussions. The artefacts in the digital whiteboards are used for cross-team discussions in discussion forums.
    - **Debate**: Each tutorial group will be divided into teams to debate on given ethical issues in a sequential manner. Each team will be given one of the ethical issues to discuss during the tutorial. The teams will present and debate their stance on the ethical issues, followed by a brief Q&A with the other teams.
    - **Project**: Students will form a project team responsible for the redesign of an existing product for ethical AI integration. The project team will start by identifying any ethical risks or dark patterns present in the current design of the chosen product and think about where users might be misled, where their data might be at risk, or where business goals might be prioritized over user well-being. The final output will be a Product Pitch to be presented at the end of the course in the tutorial sessions.
  
Underlying any ethical discussion will be the **FIS**h model which makes use of the following 3 key steps for collaborative inquiry on a problem:

1. **F**ocus - The group will specify learning issues and intended learning outcomes.
2. **I**nvestigate - The group will self-organize to plan and execute the work in search of answers to address the problem.
3. **S**hare - The group will agree on how to present findings to the other groups in the IS1108 cohort.

### Lecture

### Tutorial (Class Participation)

There was only 7 tutorials in total.

### Individual Report

The individual assignment for the course is designed to encourage students to deeply engage with the ethical issues and practical applications of digital ethics and artificial intelligence. The assignment provides an opportunity for each student to demonstrate their understanding of the course concepts, analyze real-world scenarios, and propose ethical solutions. Students are expected to make use of the FISh model as a primary framework for organizing the report for submission. This approach ensures that students systematically analyze ethical issues in digital technologies and provide well-supported, actionable solutions. Each student will submit a concise written report describing the issues, ethical considerations, proposed governance guidelines, and supporting references.  

### Midterm

**Format:** 
- Examplify Lockdown / Secure
- **Duration:** 80 mins
- 20 MCQs/MRQs and 1 Essay question with a case study
- 1 open-ended question which will each feature a case study for students to analyze an ethical scenario in computing, and apply relevant frameworks and justify recommendations with structured reasoning.

**Scope:** 
- Professional Ethics
- AI Ethics and Governance
- Data Privacy and Protection
- Human Computer Interaction and Ethical UX Design
- Automation and Autonomous Systems
- Ethical AI Product Management

**Materials**:
- **No materials**.

### Group Debate

Debate sessions will be held at the tutorial group level. Each team will be assigned a topic. (Group Debate)

### Group Product Pitch

As part of the course, students will collaborate in teams to identify ethical issues in an existing digital or AI-enabled product and propose an ethically improved redesign. The project challenges students to analyze potential risks, such as dark patterns or privacy concerns, and to develop innovative solutions that prioritize user well-being. Teams will present their final proposals in a Product Pitch at the end of the course, demonstrating their ability to apply ethical principles to real-world technology challenges.

## MA2213 - Numerical Analysis I

**Lecturer**: Fu Zhaohui  
**TA**: He Runyang

| Component           | Weight | Max | Mean  | Quartiles                  | marvinthang | Score |
| ------------------- | ------ | --- | ----- | -------------------------- | ----------- | ----- |
| Class Participation | 10%    | 100 | 97.89 | 80 / 100 / 100 / 100 / 100 | 100         | 10%   |
| Quiz (5th week)     | 15%    | 100 | 80.18 | 0 / 68 / 92 / 100 / 100    | 100         | 10%   |
| Homework 1          | 7.5%   | 100 | 97.39 | 0 / 98 / 100 / 100 / 100   | 100         | 7.5%  |
| Homework 2          | 7.5%   | 100 | ?     | ?                          | ?           | ?     |
| Midterm (7th week)  | 20%    | 100 | 78.2  | -1 / 67.5 / 85 / 95 / 100  | 100         | 20%   |
| Final exam          | 40%    | ?   | ?     | ?                          | ?           | ?     |

**Total:** ?%  
**Expected Grade:** ?

### Lecture

The lectures will be recorded and made available on Panopto.

### Class Participation

### Tutorials

Not graded.

### Homework

### Quiz 

**Format:**
- Closed-book examination
- **Duration:** 90 mins

**Materials:**
- **No** cheatsheet or calculator.

The quiz was fairly simple.

### Midterm

**Format:**
- Closed-book examination
- **Duration:** 90 mins

**Scope:** cover the first two chapters

**Materials:**
- Calculator
- **No cheatsheet**

Midterm was a bit harder than quiz, but still manageable.

### Final Exam

**Format:**
- Closed-book examination
- **Duration:** 120 mins

**Scope:**
- Computer arithmetic
- Discrete methods for solving linear systems
  - Gaussian elimination with different strategies
  - LU factorization
- Interpolation and approximation
  - Polynomial interpolation
    - Lagrange interpolation
    - Divided differences and Newton interpolation
  - Cubic spline interpolation
  - Least squares approximation
- Numerical integration
  - Newton-Cotes formulas
  - Composite integration rules
- The following topics are **NOT** included:
  - Handwrite code/pseudocode
  - LDLT and Cholesky factorization (*) in Lecture 12
  - Calculation of cubic spline interpolants

**Materials**:
- One double-sided A4 help sheet
- Calculator

## ST2334 - Probability and Statistics

**Lecturers**: Adrian Roellin (Weeks 1–7), Somabha Mukherjee (Weeks 7–13)  
**TA**: Wong Yean Ling

| Component      | Weight | Max | Mean | Quartiles                | marvinthang | Score |
| -------------- | ------ | --- | ---- | ------------------------ | ----------- | ----- |
| Online quizzes | 10%    | ?   | ?    | ?                        | ?           | 10%   |
| Tutorial       | 5%     | 5   | 4.98 | 0 / 5 / 5 / 5 / 5        | 5           | 5%    |
| Midterm        | 25%    | 20  | 16.1 | 4 / 14 / 17 / 18.75 / 20 | 20          | 25%   |
| Final          | 60%    | ?   | ?    | ?                        | ?           | ?%    |

**Total:** ?%  
**Expected Grade:** ?

### Teaching Mode

This course is offered in a blended format. Each week, you will
- watch some 40 mins worth of content videos at your own time before the live lecture; and
- attend a "live" lecture in-person (in LT27) or via Zoom on Thursdays, 6–8pm.

### Lecture

The lectures will be recorded and made available to all.

I never attend or watch any lectures, and I still did well in the course, so I would say that attending lectures is not very important for this course. The content videos are more than sufficient to cover the material.

### Online Quizzes

A series of quizzes will be given via Canvas Quizzes.

They will be graded on the basis of "completion" - as long as you attempt the quiz, you get full credit.

There will be about 23 quizzes in total for the semester.

If you complete at least 20 quizzes, you will be awarded the 10 marks assigned for this component.

If you complete fewer than 20 quizzes, you will be awarded 0.5 marks for each quiz. 

### Tutorial

From Week 3 onwards, every student will attend a weekly 1-hour tutorial.

If you miss a class, please go to another class for make-up, and keep the tutors of the classes concerned informed.

### Midterm 

**Format:**
- Digital Assessment (Examplify)
- **Duration:** 1 hour
- Format: MCQ, TF, FITB, MRQ

**Scope:** Chapters 1 to 4 (Weeks 1–6)

**Materials:**
- Formula sheet: provided on Canvas - you must print this yourself; do not write on it; it contains CDF tables for the standard normal and Poisson distributions
- One double-sided A4 help sheet
- Calculator

![Desktop View](/assets/img/posts/y1s2/ST2334-midterm.png){: width="972" height="589" }
<!-- ![Desktop View](/assets/img/posts/y1s2/ST2334-midterm.png){: width="972" height="589" .w-75 .normal} -->
_ST2334 Midterm Score Distribution_

### Final Exam

**Format:**
- Digital Assessment (Examplify)
- **Duration**: 2 hours
- 36 questions, including MCQ, MRQ, and TF.

**Materials:**
- NEW: The formula sheets and statistical tables will be provided through Examplify. You are not allowed to bring a hardcopy to the exam. 
- One double-sided A4 help sheet
- Calculator
