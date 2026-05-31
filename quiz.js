// Quiz Game Logic — with 15-second timer per question
class QuizGame {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.timerInterval = null;
        this.timeLeft = 15;
        this.TIMER_MAX = 15;

        this.loadQuestions();
        this.initializeQuiz();
    }

    loadQuestions() {
        if (typeof window.quizQuestions !== 'undefined') {
            this.questions = [...window.quizQuestions].sort(() => Math.random() - 0.5);
        } else {
            this.questions = [];
        }
    }

    initializeQuiz() {
        if (!this.questions.length) {
            document.getElementById('questionContainer').innerHTML =
                '<div style="text-align:center;color:#ff0040;padding:40px"><h3>No questions available.</h3><button onclick="goToMenu()" class="menu-btn">Back to Menu</button></div>';
            return;
        }
        this.showQuestion();
    }

    showQuestion() {
        this.stopTimer();
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
            return;
        }

        const q = this.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;

        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent =
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        document.getElementById('questionNumber').textContent =
            `Question ${this.currentQuestionIndex + 1}`;
        document.getElementById('questionText').textContent = q.question;
        document.getElementById('quizScore').textContent = this.score;

        this.createOptions(q.options);

        document.getElementById('questionContainer').style.display = 'block';
        document.getElementById('feedbackContainer').style.display = 'none';
        document.getElementById('quizComplete').style.display = 'none';

        this.selectedAnswer = null;
        document.getElementById('submitBtn').disabled = true;

        this.startTimer();
    }

    createOptions(options) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
        options.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'option';
            div.onclick = () => this.selectOption(index);

            const radio = document.createElement('input');
            radio.type = 'radio'; radio.name = 'answer'; radio.value = index;
            radio.id = `option${index}`;

            const label = document.createElement('label');
            label.htmlFor = `option${index}`;
            label.textContent = option;

            div.appendChild(radio); div.appendChild(label);
            container.appendChild(div);
        });
    }

    selectOption(index) {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        const opts = document.querySelectorAll('.option');
        opts[index].classList.add('selected');
        opts[index].querySelector('input').checked = true;
        this.selectedAnswer = index;
        document.getElementById('submitBtn').disabled = false;
    }

    // ─── TIMER ────────────────────────────────────────────────────────────────

    startTimer() {
        this.timeLeft = this.TIMER_MAX;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.timeExpired();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }

    updateTimerDisplay() {
        const countEl = document.getElementById('timerCount');
        const ringEl  = document.getElementById('timerRingFill');
        if (!countEl) return;

        countEl.textContent = this.timeLeft;

        // Ring stroke offset: 0 = full, 113 = empty
        const pct = this.timeLeft / this.TIMER_MAX;
        const offset = 113 * (1 - pct);
        if (ringEl) ringEl.style.strokeDashoffset = offset;

        // Color transition: green → yellow → red
        let color;
        if (pct > 0.6)       color = '#00ff41';
        else if (pct > 0.3)  color = '#ffaa00';
        else                  color = '#ff2244';
        if (ringEl) ringEl.style.stroke = color;
        if (countEl) countEl.style.color = color;

        // Pulse when low
        const timerEl = document.getElementById('quizTimer');
        if (timerEl) timerEl.classList.toggle('timer-urgent', this.timeLeft <= 5);
    }

    timeExpired() {
        // Auto-submit as wrong
        this.userAnswers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: -1,
            correct: false
        });
        const q = this.questions[this.currentQuestionIndex];
        this.showFeedback(false, q.explanation, true);
    }

    // ─── SUBMIT ───────────────────────────────────────────────────────────────

    submitAnswer() {
        if (this.selectedAnswer === null) return;
        this.stopTimer();

        const q = this.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === q.correct;

        this.userAnswers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: this.selectedAnswer,
            correct: isCorrect
        });

        if (isCorrect) this.score += 100;
        this.showFeedback(isCorrect, q.explanation, false);
    }

    showFeedback(isCorrect, explanation, expired) {
        const result = document.getElementById('feedbackResult');
        const expEl  = document.getElementById('feedbackExplanation');

        if (expired) {
            result.textContent = '⏱ Time\'s Up!';
            result.className = 'feedback-result incorrect';
        } else if (isCorrect) {
            result.textContent = '✅ Correct!';
            result.className = 'feedback-result correct';
        } else {
            result.textContent = '❌ Incorrect';
            result.className = 'feedback-result incorrect';
        }

        expEl.textContent = explanation;
        document.getElementById('quizScore').textContent = this.score;
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('feedbackContainer').style.display = 'block';

        const nextBtn = document.getElementById('nextBtn');
        nextBtn.textContent = this.currentQuestionIndex >= this.questions.length - 1
            ? 'Show Results' : 'Next Question';
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.showQuestion();
    }

    // ─── RESULTS ─────────────────────────────────────────────────────────────

    showResults() {
        this.stopTimer();
        const correct = this.userAnswers.filter(a => a.correct).length;
        const total   = this.questions.length;
        const pct     = Math.round((correct / total) * 100);

        document.getElementById('finalPercentage').textContent = pct + '%';
        document.getElementById('correctCount').textContent    = correct;
        document.getElementById('incorrectCount').textContent  = total - correct;
        document.getElementById('totalQuestions').textContent  = total;

        let msg = '';
        if (pct >= 90)      msg = '🎉 Outstanding cybersecurity knowledge!';
        else if (pct >= 70) msg = '👍 Solid cybersecurity awareness.';
        else if (pct >= 50) msg = '👌 Decent knowledge — keep learning!';
        else                msg = '⚠️ Consider more cybersecurity training.';
        document.getElementById('performanceMessage').textContent = msg;

        // Save best quiz score
        const best = parseInt(localStorage.getItem('cautio-best-quiz-score') || '0');
        if (pct > best) localStorage.setItem('cautio-best-quiz-score', pct.toString());

        // Save quiz result for combined report
        localStorage.setItem('cautio-quiz-result', JSON.stringify({
            score: this.score, correct, total, percentage: pct
        }));

        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('feedbackContainer').style.display = 'none';
        document.getElementById('quizComplete').style.display      = 'block';
        document.getElementById('progressFill').style.width        = '100%';
        document.getElementById('progressText').textContent        = 'Quiz Complete!';

        // Show phishing mode prompt after short delay
        setTimeout(() => {
            document.getElementById('finalPercentage').textContent = pct + '%';
            document.getElementById('correctCount').textContent    = correct;
            document.getElementById('incorrectCount').textContent  = total - correct;
            document.getElementById('totalQuestions').textContent  = total;
            document.getElementById('quizComplete').style.display  = 'none';
            document.getElementById('phishPromptScore').textContent = `Score: ${pct}%`;
            document.getElementById('phishPrompt').style.display   = 'flex';
        }, 1200);
    }

    restartQuiz() {
        this.stopTimer();
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.questions = this.questions.sort(() => Math.random() - 0.5);
        this.showQuestion();
    }
}

// ─── GLOBAL FUNCTIONS ────────────────────────────────────────────────────────

function submitAnswer()  { if (window.quiz) window.quiz.submitAnswer(); }
function nextQuestion()  { if (window.quiz) window.quiz.nextQuestion(); }
function restartQuiz()   { if (window.quiz) window.quiz.restartQuiz(); }
function goToResults()   { window.location.href = 'results.html'; }
function goToMenu()      { sessionStorage.setItem('cautio-returning','1'); window.location.href = 'index.html'; }
function phishPromptYes(){ window.location.href = 'phishing.html'; }
function phishPromptNo() { window.location.href = 'results.html'; }

document.addEventListener('DOMContentLoaded', () => {
    window.quiz = new QuizGame();
    // Update completion buttons to go to results
    const quizComplete = document.getElementById('quizComplete');
    if (quizComplete) {
        const btns = quizComplete.querySelector('.completion-buttons');
        if (btns) {
            btns.innerHTML = `
                <button class="retake-btn" onclick="restartQuiz()">Retake Quiz</button>
                <button class="menu-btn results-nav-btn" onclick="goToResults()">See Full Report</button>
                <button class="menu-btn" onclick="goToMenu()">Main Menu</button>
            `;
        }
    }
});
