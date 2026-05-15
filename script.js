const skillDictionary = [
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "node.js",
  "sql",
  "mongodb",
  "postgresql",
  "machine learning",
  "deep learning",
  "nlp",
  "natural language processing",
  "tensorflow",
  "pytorch",
  "scikit-learn",
  "pandas",
  "numpy",
  "data visualization",
  "power bi",
  "tableau",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "git",
  "api",
  "rest",
  "analytics",
  "statistics",
  "classification",
  "regression",
  "resume screening",
  "dashboards",
  "communication",
  "leadership",
  "problem solving",
];

const sampleJob = `We are hiring a Machine Learning Engineer to build NLP products for hiring intelligence.
Must have Python, NLP, machine learning, scikit-learn, pandas, SQL, REST APIs, data visualization, dashboards, statistics, and strong communication skills.
Experience with React, Node.js, AWS, and model evaluation is preferred.`;

const sampleResumes = [
  {
    name: "Aarav Sharma Resume.txt",
    text: `Aarav Sharma
Machine Learning Engineer with 4 years of experience in Python, NLP, scikit-learn, pandas, numpy, SQL, and REST API development.
Built resume screening workflows, classification models, dashboards, and analytics reports for HR teams. Strong communication and problem solving.`,
  },
  {
    name: "Maya Patel Resume.txt",
    text: `Maya Patel
Frontend engineer skilled in React, TypeScript, JavaScript, Node.js, dashboards, data visualization, Git, and API integrations.
Collaborated with product and recruiting teams. Familiar with Python and AWS.`,
  },
  {
    name: "Rohan Mehta Resume.txt",
    text: `Rohan Mehta
Data analyst with SQL, Tableau, Power BI, statistics, pandas, analytics, regression, and communication skills.
Created recruiter reports and hiring funnel dashboards. Basic machine learning exposure.`,
  },
];

let resumes = [];

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const els = {
  jobDescription: document.querySelector("#jobDescription"),
  jdFile: document.querySelector("#jdFile"),
  jdFileStatus: document.querySelector("#jdFileStatus"),
  resumeFiles: document.querySelector("#resumeFiles"),
  fileList: document.querySelector("#fileList"),
  screenButton: document.querySelector("#screenButton"),
  loadSampleJob: document.querySelector("#loadSampleJob"),
  loadSampleResumes: document.querySelector("#loadSampleResumes"),
  statusPill: document.querySelector("#statusPill"),
  totalResumes: document.querySelector("#totalResumes"),
  averageMatch: document.querySelector("#averageMatch"),
  topCandidate: document.querySelector("#topCandidate"),
  skillCoverage: document.querySelector("#skillCoverage"),
  rankingCount: document.querySelector("#rankingCount"),
  candidateList: document.querySelector("#candidateList"),
  scoreChart: document.querySelector("#scoreChart"),
  skillCloud: document.querySelector("#skillCloud"),
  requiredSkillCount: document.querySelector("#requiredSkillCount"),
};

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s.+#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSkills(text) {
  const normalized = normalize(text);
  return skillDictionary.filter((skill) => normalized.includes(skill));
}

function tokenize(text) {
  const stopWords = new Set([
    "and",
    "the",
    "with",
    "for",
    "are",
    "this",
    "that",
    "have",
    "from",
    "will",
    "must",
    "role",
    "team",
    "years",
    "experience",
  ]);

  return normalize(text)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function scoreResume(resume, jobText) {
  const requiredSkills = extractSkills(jobText);
  const resumeSkills = extractSkills(resume.text);
  const matchedSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill));

  const jobTerms = new Set(tokenize(jobText));
  const resumeTerms = new Set(tokenize(resume.text));
  const keywordMatches = [...jobTerms].filter((term) => resumeTerms.has(term));

  const skillScore = requiredSkills.length
    ? matchedSkills.length / requiredSkills.length
    : 0;
  const keywordScore = jobTerms.size ? keywordMatches.length / jobTerms.size : 0;
  const score = Math.round((skillScore * 0.75 + keywordScore * 0.25) * 100);

  return {
    ...resume,
    displayName: inferCandidateName(resume),
    score,
    matchedSkills,
    missingSkills,
    resumeSkills,
    keywordMatches,
  };
}

function inferCandidateName(resume) {
  const firstLine = resume.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine && firstLine.length < 60 && !firstLine.includes("@")) {
    return firstLine;
  }

  return resume.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}

async function extractTextFromFile(file) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return file.text();
  }

  if (!window.pdfjsLib) {
    throw new Error("PDF reader is not loaded. Please connect to the internet and refresh.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n");
}

function renderFiles() {
  if (!resumes.length) {
    els.fileList.innerHTML = "";
    return;
  }

  els.fileList.innerHTML = resumes
    .map(
      (resume) => `
        <div class="file-chip">
          <span>${escapeHtml(resume.name)}</span>
          <span>${Math.max(1, Math.round(resume.text.length / 1000))}k chars</span>
        </div>
      `
    )
    .join("");
}

function renderSkillCloud(requiredSkills) {
  els.requiredSkillCount.textContent = `${requiredSkills.length} detected`;
  els.skillCloud.innerHTML = requiredSkills.length
    ? requiredSkills
        .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join("")
    : `<div class="empty-state">No required skills detected yet.</div>`;
}

function renderResults(results, requiredSkills) {
  const total = results.length;
  const average = total
    ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / total)
    : 0;
  const top = results[0];
  const coveredSkills = new Set(results.flatMap((item) => item.matchedSkills));
  const coverage = requiredSkills.length
    ? Math.round((coveredSkills.size / requiredSkills.length) * 100)
    : 0;

  els.totalResumes.textContent = total;
  els.averageMatch.textContent = `${average}%`;
  els.topCandidate.textContent = top ? top.displayName : "-";
  els.skillCoverage.textContent = `${coverage}%`;
  els.rankingCount.textContent = `${total} screened`;
  els.statusPill.textContent = total ? "Screening complete" : "Waiting for resumes";

  els.candidateList.innerHTML = total
    ? results.map(candidateCard).join("")
    : `<div class="empty-state">Add a job description and resumes to see ranked candidates.</div>`;

  els.scoreChart.innerHTML = total
    ? results.map(scoreRow).join("")
    : `<div class="empty-state">Scores will appear after screening.</div>`;

  renderSkillCloud(requiredSkills);
}

function candidateCard(candidate, index) {
  const matched = candidate.matchedSkills.length
    ? candidate.matchedSkills
        .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join("")
    : `<span class="skill-tag missing">No required skills matched</span>`;
  const missing = candidate.missingSkills.length
    ? candidate.missingSkills
        .slice(0, 8)
        .map((skill) => `<span class="skill-tag missing">${escapeHtml(skill)}</span>`)
        .join("")
    : `<span class="skill-tag">All required skills covered</span>`;

  return `
    <article class="candidate-card">
      <div class="candidate-topline">
        <div>
          <h4 class="candidate-name">#${index + 1} ${escapeHtml(candidate.displayName)}</h4>
          <p class="candidate-meta">${candidate.matchedSkills.length} matched skills - ${
    candidate.keywordMatches.length
  } relevant terms</p>
        </div>
        <div class="score-badge">${candidate.score}%</div>
      </div>
      <div class="progress-track">
        <div class="progress-bar" style="width: ${candidate.score}%"></div>
      </div>
      <div>
        <p class="candidate-meta">Matched skills</p>
        <div class="skill-row">${matched}</div>
      </div>
      <div>
        <p class="candidate-meta">Missing skills</p>
        <div class="skill-row">${missing}</div>
      </div>
    </article>
  `;
}

function scoreRow(candidate) {
  return `
    <div class="chart-row">
      <div class="chart-name" title="${escapeHtml(candidate.displayName)}">${escapeHtml(
    candidate.displayName
  )}</div>
      <div class="chart-bar-track">
        <div class="chart-bar" style="width: ${candidate.score}%"></div>
      </div>
      <div class="chart-score">${candidate.score}%</div>
    </div>
  `;
}

function screenResumes() {
  const jobText = els.jobDescription.value.trim();
  if (!jobText || !resumes.length) {
    els.statusPill.textContent = "Add job details and resumes";
    return;
  }

  const requiredSkills = extractSkills(jobText);
  const results = resumes
    .map((resume) => scoreResume(resume, jobText))
    .sort((a, b) => b.score - a.score);

  renderResults(results, requiredSkills);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

els.resumeFiles.addEventListener("change", async (event) => {
  const files = [...event.target.files];
  els.statusPill.textContent = "Reading resume files...";

  try {
    resumes = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        text: await extractTextFromFile(file),
      }))
    );
    renderFiles();
    els.statusPill.textContent = `${resumes.length} resume${
      resumes.length === 1 ? "" : "s"
    } loaded`;
  } catch (error) {
    els.statusPill.textContent = error.message;
  }
});

if (els.jdFile) {
  els.jdFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    els.statusPill.textContent = "Reading JD file...";
    els.jdFileStatus.innerHTML = `
      <div class="file-chip">
        <span>${escapeHtml(file.name)}</span>
        <span>loading</span>
      </div>
    `;

    try {
      els.jobDescription.value = await extractTextFromFile(file);
      els.jdFileStatus.innerHTML = `
        <div class="file-chip">
          <span>${escapeHtml(file.name)}</span>
          <span>${Math.max(1, Math.round(els.jobDescription.value.length / 1000))}k chars</span>
        </div>
      `;
      els.statusPill.textContent = "JD file loaded";
    } catch (error) {
      els.jdFileStatus.innerHTML = "";
      els.statusPill.textContent = error.message;
    }
  });
}

els.loadSampleJob.addEventListener("click", () => {
  els.jobDescription.value = sampleJob;
});

els.loadSampleResumes.addEventListener("click", () => {
  resumes = sampleResumes;
  renderFiles();
  els.statusPill.textContent = "Sample resumes loaded";
});

els.screenButton.addEventListener("click", screenResumes);

renderSkillCloud([]);
