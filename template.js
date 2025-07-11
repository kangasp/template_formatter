let questionsData = [];
let userAnswers = {};

// Load format.txt by default
document.addEventListener('DOMContentLoaded', () => {
    loadDefaultFormat();
});

document.getElementById('load-format-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            parseFormat(e.target.result);
        };
        reader.readAsText(file);
    }
});

document.getElementById('copy-btn').addEventListener('click', () => {
    const outputText = document.getElementById('output-text');
    outputText.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copy-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1000);
});

async function loadDefaultFormat() {
    try {
        const response = await fetch('format.txt');
        const text = await response.text();
        parseFormat(text);
    } catch (error) {
        console.log('Could not load format.txt automatically. Please use the load button.');
    }
}

function parseFormat(text) {
    questionsData = [];
    userAnswers = {};
    
    // Clear the output when reloading format
    clearOutput();
    
    const lines = text.split('\n');
    let currentQuestion = null;
    let currentAnswer = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;
        
        if (line.startsWith('-Q ')) {
            // Save previous question if exists
            if (currentQuestion) {
                questionsData.push(currentQuestion);
            }
            
            // Start new question
            currentQuestion = {
                question: line.substring(3).trim(),
                answers: []
            };
            currentAnswer = null;
            
        } else if (line.startsWith('-A ')) {
            const answerText = line.substring(3).trim();
            currentAnswer = {
                text: answerText,
                isOpenEnded: answerText === '-?',
                template: ''
            };
            if (currentQuestion) {
                currentQuestion.answers.push(currentAnswer);
            }
            
        } else if (line.startsWith('-T ') && currentAnswer) {
            currentAnswer.template = line.substring(3).trim();
        }
    }
    
    // Add the last question
    if (currentQuestion) {
        questionsData.push(currentQuestion);
    }
    
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    questionsData.forEach((questionData, questionIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionLabel = document.createElement('label');
        questionLabel.textContent = questionData.question;
        questionLabel.className = 'question-label';
        questionDiv.appendChild(questionLabel);
        
        // Check if this is an open-ended question
        const hasOpenEnded = questionData.answers.some(answer => answer.isOpenEnded);
        
        if (hasOpenEnded) {
            // Create text input for open-ended questions
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'answer-input';
            input.placeholder = 'Enter your answer...';
            input.addEventListener('input', () => {
                userAnswers[questionIndex] = {
                    text: input.value,
                    template: questionData.answers[0].template
                };
                generateOutput();
            });
            questionDiv.appendChild(input);
        } else {
            // Create dropdown for multiple choice questions
            const select = document.createElement('select');
            select.className = 'answer-select';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select an answer...';
            select.appendChild(defaultOption);
            
            // Add answer options
            questionData.answers.forEach((answer, answerIndex) => {
                const option = document.createElement('option');
                option.value = answerIndex;
                option.textContent = answer.text;
                select.appendChild(option);
            });
            
            select.addEventListener('change', () => {
                if (select.value !== '') {
                    const answerIndex = parseInt(select.value);
                    userAnswers[questionIndex] = {
                        text: questionData.answers[answerIndex].text,
                        template: questionData.answers[answerIndex].template
                    };
                } else {
                    delete userAnswers[questionIndex];
                }
                generateOutput();
            });
            
            questionDiv.appendChild(select);
        }
        
        container.appendChild(questionDiv);
    });
}

function generateOutput() {
    let output = '';
    
    Object.values(userAnswers).forEach(answer => {
        if (answer.template) {
            // Replace -? with the user's answer
            const processedTemplate = answer.template.replace(/-\?/g, answer.text);
            output += processedTemplate + '\n';
        }
    });
    
    const outputText = document.getElementById('output-text');
    outputText.value = output.trim();
    
    // Show output section if there's content
    const outputSection = document.getElementById('output-section');
    if (output.trim()) {
        outputSection.style.display = 'block';
    } else {
        outputSection.style.display = 'none';
    }
}

function clearOutput() {
    const outputText = document.getElementById('output-text');
    outputText.value = '';
    const outputSection = document.getElementById('output-section');
    outputSection.style.display = 'none';
}
