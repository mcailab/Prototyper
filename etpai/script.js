// Global State Management
let currentTab = 'expense';
let isAutoPlay = true; // Default to auto-play
let isPaused = false;
let autoPlayInterval = null;
let messageQueue = [];
let currentStep = 0;

// Chat Messages for Each Use Case
const chatFlows = {
    expense: [
        { type: 'bot', message: 'Welcome to ExpenseClaim! I can help you submit expense reports instantly.' },
        { type: 'bot', message: 'Please upload your receipt to get started.' },
        { type: 'user', message: 'Here is my business lunch receipt from The Blue Orchid.', file: 'receipt_blue_orchid.jpg', showPreview: 'receipt' },
        { type: 'bot', message: 'Processing your receipt...', processing: true },
        { type: 'bot', message: 'Great! I found the following information:\\n• Vendor: The Blue Orchid\\n• Total Amount: $197.10\\n• Date: January 15, 2025\\n• Payment: Corporate Card ****4589' },
        { type: 'bot', message: 'I\'ve populated the expense form. Please review and submit when ready.' },
        { type: 'system', action: 'fillExpenseForm' },
        { type: 'user', message: 'Perfect! The details are accurate. Submitting now.' },
        { type: 'system', action: 'submitExpenseForm' },
        { type: 'bot', message: '✓ Expense report submitted successfully! Reference #EXP-2025-0115' }
    ],
    leave: [
        { type: 'bot', message: 'Welcome to ApplyLeave! I\'ll help you apply for leave based on your travel documents.' },
        { type: 'bot', message: 'Please upload your flight ticket or boarding pass.' },
        { type: 'user', message: 'Here\'s my flight ticket to New York.', file: 'flight_ticket_NYC.pdf', showPreview: 'ticket' },
        { type: 'bot', message: 'Analyzing your travel document...', processing: true },
        { type: 'bot', message: 'Perfect! I detected:\\n• Departure: February 20, 2025\\n• Return: February 24, 2025\\n• Destination: New York' },
        { type: 'bot', message: 'Your leave application has been prepared. Review the details on the right.' },
        { type: 'system', action: 'fillLeaveForm' },
        { type: 'user', message: 'Everything looks correct. Please submit.' },
        { type: 'system', action: 'submitLeaveForm' },
        { type: 'bot', message: '✓ Leave request submitted! Your manager will be notified. Reference #LV-2025-0220' }
    ],
    talent: [
        { type: 'bot', message: 'Welcome to TalentMatch! I\'ll analyze resumes and match them with open positions.' },
        { type: 'bot', message: 'Please upload a candidate\'s resume for analysis.' },
        { type: 'user', message: 'I\'m uploading John Doe\'s resume for the senior developer position.', file: 'resume_john_doe.docx', showPreview: 'resume' },
        { type: 'bot', message: 'Analyzing resume and extracting skills...', processing: true },
        { type: 'bot', message: 'Excellent candidate! Key findings:\\n• 7 years experience\\n• Strong in Python, React, AWS\\n• Leadership experience' },
        { type: 'bot', message: 'Matching with open positions in your organization...' },
        { type: 'system', action: 'fillTalentDashboard' },
        { type: 'bot', message: 'Found 3 strong matches! Best fit: Senior Full Stack Developer (95% match)' },
        { type: 'user', message: 'Excellent! Please schedule an interview with the hiring manager.' },
        { type: 'system', action: 'scheduleTalentInterview' },
        { type: 'bot', message: '✓ Interview scheduled for next Tuesday at 2 PM. Calendar invites sent to all parties.' }
    ]
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeTabs();
    initializeUploadZone();
    initializeChatInput();
    updateSceneIndicator();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
    
    // Start auto-play by default - show opening slide first
    if (isAutoPlay) {
        updatePlayPauseButton();
        
        // Show opening slide first
        showOpeningSlide(() => {
            // After opening slide, start with expense tab
            setTimeout(() => {
                switchTab('expense');
            }, 500);
        });
    }
});

// Show Opening Slide
function showOpeningSlide(callback) {
    const openingOverlay = document.getElementById('openingOverlay');
    
    // Add click handlers to opening tabs
    const expenseTab = openingOverlay.querySelector('.expense-tab');
    const leaveTab = openingOverlay.querySelector('.leave-tab');
    const talentTab = openingOverlay.querySelector('.talent-tab');
    
    if (expenseTab) {
        expenseTab.onclick = () => {
            openingOverlay.classList.remove('show');
            setTimeout(() => {
                switchTab('expense');
            }, 300);
        };
    }
    
    if (leaveTab) {
        leaveTab.onclick = () => {
            openingOverlay.classList.remove('show');
            setTimeout(() => {
                switchTab('leave');
            }, 300);
        };
    }
    
    if (talentTab) {
        talentTab.onclick = () => {
            openingOverlay.classList.remove('show');
            setTimeout(() => {
                switchTab('talent');
            }, 300);
        };
    }
    
    // Show opening overlay with fade in
    setTimeout(() => {
        openingOverlay.classList.add('show');
    }, 50);
    
    // Auto-hide after 4 seconds if not paused
    const autoHideTimeout = setTimeout(() => {
        if (!isPaused) {
            openingOverlay.classList.remove('show');
            
            // Wait for fade out transition to complete before calling callback
            setTimeout(() => {
                if (callback) callback();
            }, 500);
        }
    }, 4000); // Show opening slide for 4 seconds
    
    // Store timeout for cleanup
    openingOverlay.autoHideTimeout = autoHideTimeout;
}

// Control Panel Management
function initializeControls() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => toggleFullscreen());
    }
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => togglePlayPause());
    }
}

// Play/Pause Toggle
function togglePlayPause() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const openingOverlay = document.getElementById('openingOverlay');
    const conclusionOverlay = document.getElementById('conclusionOverlay');
    
    // Toggle pause/play
    isPaused = !isPaused;
    updatePlayPauseButton();
    
    if (!isPaused) {
        // Resume from appropriate state
        if (openingOverlay.classList.contains('show')) {
            // If on opening slide, hide it and start
            if (openingOverlay.autoHideTimeout) {
                clearTimeout(openingOverlay.autoHideTimeout);
            }
            openingOverlay.classList.remove('show');
            setTimeout(() => {
                switchTab('expense');
            }, 500);
        } else if (conclusionOverlay.classList.contains('show')) {
            // If on conclusion slide, hide it and restart
            conclusionOverlay.classList.remove('show');
            setTimeout(() => {
                switchTab('expense');
            }, 500);
        } else {
            // Normal resume
            processNextStep();
        }
    }
}

function updatePlayPauseButton() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (isPaused) {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
        playPauseBtn.classList.remove('active');
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        playPauseBtn.classList.add('active');
    }
}

// Tab Navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

function switchTab(tabName) {
    // Prevent conflicts - stop any ongoing animations
    isPaused = true;
    
    // Update active tab
    currentTab = tabName;
    currentStep = 0;
    
    // Clear all timeouts and intervals to prevent conflicts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
    }
    
    // Update tab buttons IMMEDIATELY
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('expense-active', 'leave-active', 'talent-active');
    });
    
    const activeTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.add(`${tabName}-active`);
    }
    
    // Show intro overlay first
    showIntroSlide(tabName, () => {
        // Hide all upload previews
        document.getElementById('receiptPreview').style.display = 'none';
        document.getElementById('ticketPreview').style.display = 'none';
        document.getElementById('resumePreview').style.display = 'none';
        
        // Update system interfaces
        document.querySelectorAll('.system-interface').forEach(interface => {
            interface.classList.remove('active');
        });
        
        // Show corresponding system
        if (tabName === 'expense') {
            document.getElementById('expense-system').classList.add('active');
        } else if (tabName === 'leave') {
            document.getElementById('leave-system').classList.add('active');
        } else if (tabName === 'talent') {
            document.getElementById('talent-system').classList.add('active');
        }
        
        // Clear and restart chat
        clearChat();
        resetForms();
        
        // Hide all success screens
        document.querySelectorAll('.success-screen').forEach(screen => {
            screen.classList.remove('show');
        });
        
        // Reset auto-play state
        if (isAutoPlay) {
            isPaused = false;
            updatePlayPauseButton();
        }
        
        // Start the flow with a clean slate
        setTimeout(() => {
            if (isAutoPlay && !isPaused) {
                processNextStep();
            } else {
                // Show first message
                const flow = chatFlows[currentTab];
                if (flow && flow[0]) {
                    addMessage(flow[0].type, flow[0].message);
                    currentStep = 1;
                    updateChatInputPlaceholder();
                }
            }
        }, 100);
        
        updateSceneIndicator();
    });
}

// Chat Management
function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
}

function addMessage(type, message, options = {}) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    if (type === 'bot') {
        messageDiv.className = 'bot-message';
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Create message structure with placeholder for typewriter text
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
        `;
        messageDiv.appendChild(messageContent);
        
        // Add typewriter effect for bot messages in auto-play mode
        if (isAutoPlay && !options.processing) {
            const paragraph = document.createElement('p');
            messageContent.appendChild(paragraph);
            typewriterEffect(paragraph, message.replace(/\\n/g, '<br>'), 30);
        } else {
            messageContent.innerHTML = `
                <p>${message.replace(/\\n/g, '<br>')}</p>
                ${options.processing ? `
                    <div class="processing-indicator">
                        <i class="fas fa-spinner"></i>
                        <span>Processing...</span>
                    </div>
                ` : ''}
            `;
        }
        
        // Scroll to chat for bot messages on mobile
        setTimeout(() => scrollToChat(), 100);
        
    } else if (type === 'user') {
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                ${options.file ? `
                    <div class="upload-notification">
                        <i class="fas fa-file-upload"></i>
                        <span>${options.file}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Scroll to chat for user messages on mobile
        setTimeout(() => scrollToChat(), 100);
    }
    
    if (messageDiv.className) {
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show upload preview if specified
    if (options.showPreview) {
        showUploadPreview(options.showPreview, true);
        // Scroll to preview after it's shown (mobile only) - increased delay
        setTimeout(() => {
            scrollToUploadPreview();
            // Auto-scroll back to chat after showing preview - increased delay
            if (isMobile()) {
                setTimeout(() => scrollToChat(), 3000);
            }
        }, 500);
    }
}

// Typewriter effect function
function typewriterEffect(element, text, speed) {
    let i = 0;
    const html = text;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    element.innerHTML = '';
    
    function type() {
        if (i < textContent.length) {
            if (textContent.charAt(i) === '\\n' || (html.indexOf('<br>') !== -1 && i === html.indexOf('<br>'))) {
                element.innerHTML += '<br>';
            } else {
                element.innerHTML += textContent.charAt(i);
            }
            i++;
            
            // Add cursor effect
            element.innerHTML = element.innerHTML.replace(/<span class="typewriter-cursor"><\/span>/g, '') + '<span class="typewriter-cursor"></span>';
            
            setTimeout(type, speed);
        } else {
            // Remove cursor when done
            element.innerHTML = element.innerHTML.replace(/<span class="typewriter-cursor"><\/span>/g, '');
        }
    }
    
    type();
}

// Get file type icon based on file extension
function getFileTypeIcon(filename) {
    if (!filename) return 'fas fa-file';
    
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
            return 'fas fa-image';
        case 'pdf':
            return 'fas fa-file-pdf';
        case 'doc':
        case 'docx':
            return 'fas fa-file-word';
        case 'xls':
        case 'xlsx':
            return 'fas fa-file-excel';
        case 'ppt':
        case 'pptx':
            return 'fas fa-file-powerpoint';
        case 'txt':
            return 'fas fa-file-alt';
        case 'zip':
        case 'rar':
        case '7z':
            return 'fas fa-file-archive';
        default:
            return 'fas fa-file';
    }
}

// Show Upload Preview with auto-minimize
function showUploadPreview(type, autoMinimize = true) {
    // Hide all previews first
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('ticketPreview').style.display = 'none';
    document.getElementById('resumePreview').style.display = 'none';
    
    let preview = null;
    let filename = '';
    
    // Show relevant preview with appropriate file icon
    if (type === 'receipt') {
        preview = document.getElementById('receiptPreview');
        filename = 'receipt_blue_orchid.jpg';
    } else if (type === 'ticket') {
        preview = document.getElementById('ticketPreview');
        filename = 'flight_ticket_NYC.pdf';
    } else if (type === 'resume') {
        preview = document.getElementById('resumePreview');
        filename = 'resume_john_doe.docx';
    }
    
    if (preview) {
        // Show preview with expand animation
        preview.style.display = 'block';
        preview.classList.add('preview-expanded');
        
        // Update file icon based on type
        const fileIcon = preview.querySelector('.file-type-icon');
        if (fileIcon) {
            fileIcon.className = 'file-type-icon ' + getFileTypeIcon(filename);
        }
        
        // Auto-minimize after showing for a while (only in auto-play mode)
        if (autoMinimize && isAutoPlay) {
            setTimeout(() => {
                // Add minimizing animation
                preview.classList.add('preview-minimizing');
                
                // Hide after animation completes
                setTimeout(() => {
                    preview.style.display = 'none';
                    preview.classList.remove('preview-expanded', 'preview-minimizing');
                }, 500);
            }, 3500); // Show for 3.5 seconds before minimizing
        }
    }
}

// Initialize Chat Input
function initializeChatInput() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    
    chatSendBtn.addEventListener('click', handleChatSubmit);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleChatSubmit();
        }
    });
    
    // Enable drag and drop on chat input
    chatInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatInput.placeholder = 'Drop your file here...';
    });
    
    chatInput.addEventListener('dragleave', () => {
        updateChatInputPlaceholder();
    });
    
    chatInput.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFileUpload();
    });
}

// Update chat input placeholder based on context
function updateChatInputPlaceholder() {
    const chatInput = document.getElementById('chatInput');
    const flow = chatFlows[currentTab];
    
    if (!flow || currentStep >= flow.length) {
        chatInput.placeholder = 'Type your message...';
        return;
    }
    
    const step = flow[currentStep];
    
    if (!isAutoPlay) {
        // Manual mode - provide helpful placeholder text
        if (step.type === 'user') {
            if (step.file) {
                chatInput.placeholder = `Upload ${step.file} or press Enter to continue...`;
            } else {
                chatInput.placeholder = `Type "${step.message}" or press Enter...`;
            }
        } else {
            chatInput.placeholder = 'Press Enter to continue...';
        }
    } else {
        chatInput.placeholder = 'Type your message or drag & drop files here...';
    }
}

// Handle chat submission
function handleChatSubmit() {
    const chatInput = document.getElementById('chatInput');
    const inputValue = chatInput.value.trim();
    
    if (!isAutoPlay) {
        // Manual mode - proceed with predefined flow regardless of input
        const flow = chatFlows[currentTab];
        if (flow && currentStep < flow.length) {
            const step = flow[currentStep];
            
            // If it's a user step, show the predefined message
            if (step.type === 'user') {
                // Clear input
                chatInput.value = '';
                // Process the predefined step
                processNextStep();
            } else {
                // For non-user steps, just continue
                processNextStep();
            }
        }
    } else if (inputValue) {
        // Auto mode - show user's actual message
        addMessage('user', inputValue);
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const typingIndicator = showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                addMessage('bot', 'Processing your request...');
            }, 1000);
        }, 500);
    }
    
    updateChatInputPlaceholder();
}

// Handle file upload simulation
function handleFileUpload() {
    if (!isAutoPlay) {
        // In manual mode, proceed with the predefined flow
        const flow = chatFlows[currentTab];
        if (flow && currentStep < flow.length) {
            const step = flow[currentStep];
            if (step.type === 'user' && step.file) {
                processNextStep();
            }
        }
    }
}

// Add typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-message';
    typingDiv.innerHTML = `
        <div class="bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

function removeTypingIndicator(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

// Form Management
function resetForms() {
    // Reset expense form
    document.getElementById('expense-vendor').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = '';
    document.getElementById('expense-category').selectedIndex = 0;
    document.getElementById('expense-description').value = '';
    document.querySelector('#expense-form .submit-btn').disabled = true;
    
    // Reset leave form
    document.getElementById('leave-from').value = '';
    document.getElementById('leave-to').value = '';
    document.getElementById('leave-type').selectedIndex = 0;
    document.getElementById('leave-destination').value = '';
    document.getElementById('leave-reason').value = '';
    document.querySelector('#leave-form .submit-btn').disabled = true;
    document.getElementById('leave-calendar').classList.remove('active');
    
    // Reset talent dashboard
    document.getElementById('candidate-info').innerHTML = `
        <h3><i class="fas fa-id-card"></i> Candidate Profile</h3>
        <div class="info-placeholder">
            <i class="fas fa-user-circle"></i>
            <p>Upload resume to view candidate details</p>
        </div>
    `;
    document.getElementById('job-matches').innerHTML = `
        <h3><i class="fas fa-briefcase"></i> Job Matches</h3>
        <div class="matches-placeholder">
            <i class="fas fa-search"></i>
            <p>Matching positions will appear here</p>
        </div>
    `;
    
    // Remove filled classes
    document.querySelectorAll('.filled').forEach(el => el.classList.remove('filled'));
    
    // Reset status messages
    document.getElementById('expense-status').innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Form will be populated after document upload</span>
    `;
    document.getElementById('leave-status').innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Upload your travel document to auto-fill this form</span>
    `;
}

// Form Filling Animations
function fillExpenseForm() {
    // Scroll to system panel first - increased delay for mobile
    setTimeout(() => scrollToSystem(), 300);
    
    const fields = [
        { id: 'expense-vendor', value: 'The Blue Orchid', delay: 200 },
        { id: 'expense-amount', value: '$197.10', delay: 400 },
        { id: 'expense-date', value: 'January 15, 2025', delay: 600 },
        { id: 'expense-category', value: 'Business Meals', delay: 800, isSelect: true },
        { id: 'expense-description', value: 'Business lunch with client team - Q1 planning discussion', delay: 1000 }
    ];
    
    fields.forEach(field => {
        setTimeout(() => {
            const element = document.getElementById(field.id);
            const formGroup = element.closest('.form-group');
            
            // Auto-scroll to the field being filled
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Add glowing effect to form group
            if (formGroup) {
                formGroup.classList.add('filling');
                setTimeout(() => formGroup.classList.remove('filling'), 1000);
            }
            
            if (field.isSelect) {
                element.innerHTML = `
                    <option>Business Meals</option>
                    <option>Travel</option>
                    <option>Supplies</option>
                `;
                element.selectedIndex = 0;
                element.disabled = false;
            } else {
                element.value = field.value;
                element.readOnly = false;
            }
            element.classList.add('filled');
        }, field.delay);
    });
    
    setTimeout(() => {
        document.querySelector('#expense-form .submit-btn').disabled = false;
        document.getElementById('expense-status').classList.add('success');
        document.getElementById('expense-status').innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Form populated successfully! Ready to submit.</span>
        `;
        // Scroll to submit button - increased delay for mobile
        setTimeout(() => scrollToSubmitButton(), 400);
    }, 1200);
}

function fillLeaveForm() {
    // Scroll to system panel first - increased delay for mobile
    setTimeout(() => scrollToSystem(), 300);
    
    const fields = [
        { id: 'leave-from', value: 'February 20, 2025', delay: 200 },
        { id: 'leave-to', value: 'February 24, 2025', delay: 400 },
        { id: 'leave-type', value: 'Annual Leave', delay: 600, isSelect: true },
        { id: 'leave-destination', value: 'New York, NY', delay: 800 },
        { id: 'leave-reason', value: 'Personal travel - Family visit', delay: 1000 }
    ];
    
    fields.forEach(field => {
        setTimeout(() => {
            const element = document.getElementById(field.id);
            if (field.isSelect) {
                element.innerHTML = `
                    <option>Annual Leave</option>
                    <option>Sick Leave</option>
                    <option>Personal Leave</option>
                `;
                element.selectedIndex = 0;
                element.disabled = false;
            } else {
                element.value = field.value;
                element.readOnly = false;
            }
            element.classList.add('filled');
        }, field.delay);
    });
    
    setTimeout(() => {
        // Show calendar
        const calendar = document.getElementById('leave-calendar');
        calendar.classList.add('active');
        calendar.querySelector('.calendar-preview').innerHTML = generateCalendar();
        
        document.querySelector('#leave-form .submit-btn').disabled = false;
        document.getElementById('leave-status').classList.add('success');
        document.getElementById('leave-status').innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Leave dates extracted and form populated!</span>
        `;
        // Scroll to submit button
        setTimeout(() => scrollToSubmitButton(), 200);
    }, 1200);
}

function fillTalentDashboard() {
    // Scroll to system panel first - increased delay for mobile
    setTimeout(() => scrollToSystem(), 300);
    
    // Fill candidate info
    setTimeout(() => {
        document.getElementById('candidate-info').innerHTML = `
            <h3><i class="fas fa-id-card"></i> Candidate Profile</h3>
            <div class="candidate-details">
                <div class="detail-item">
                    <strong>Name:</strong>
                    <span>John Doe</span>
                </div>
                <div class="detail-item">
                    <strong>Experience:</strong>
                    <span>7 years</span>
                </div>
                <div class="detail-item">
                    <strong>Current Role:</strong>
                    <span>Senior Developer</span>
                </div>
                <div class="detail-item">
                    <strong>Education:</strong>
                    <span>B.S. Computer Science</span>
                </div>
            </div>
        `;
    }, 500);
    
    // Fill job matches with scrollable content wrapper
    setTimeout(() => {
        document.getElementById('job-matches').innerHTML = `
            <h3><i class="fas fa-briefcase"></i> Job Matches</h3>
            <div class="job-matches-content">
                <div class="job-match-card">
                    <div class="job-info">
                        <h4>Senior Full Stack Developer</h4>
                        <p>Engineering Team</p>
                    </div>
                    <div class="match-score high">95%</div>
                </div>
                <div class="job-match-card">
                    <div class="job-info">
                        <h4>Cloud Solutions Architect</h4>
                        <p>Infrastructure Team</p>
                    </div>
                    <div class="match-score medium">82%</div>
                </div>
                <div class="job-match-card">
                    <div class="job-info">
                        <h4>Engineering Manager</h4>
                        <p>Product Team</p>
                    </div>
                    <div class="match-score medium">78%</div>
                </div>
            </div>
        `;
    }, 1000);
    
    // Fill skills analysis
    setTimeout(() => {
        document.getElementById('skills-analysis').innerHTML = `
            <h3><i class="fas fa-chart-radar"></i> Skills Analysis</h3>
            <div class="skills-chart">
                <div class="skill-item">
                    <span class="skill-name">Python</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: 95%">
                            <span>95%</span>
                        </div>
                    </div>
                </div>
                <div class="skill-item">
                    <span class="skill-name">React</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: 90%">
                            <span>90%</span>
                        </div>
                    </div>
                </div>
                <div class="skill-item">
                    <span class="skill-name">AWS</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: 85%">
                            <span>85%</span>
                        </div>
                    </div>
                </div>
                <div class="skill-item">
                    <span class="skill-name">Docker</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: 80%">
                            <span>80%</span>
                        </div>
                    </div>
                </div>
                <div class="skill-item">
                    <span class="skill-name">Leadership</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: 75%">
                            <span>75%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }, 1500);
}

// Generate Calendar
function generateCalendar() {
    const days = [];
    for (let i = 19; i <= 25; i++) {
        const isSelected = i >= 20 && i <= 24;
        const isWeekend = i === 22 || i === 23;
        days.push(`<div class="calendar-day ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}">${i}</div>`);
    }
    return days.join('');
}

// Submit Form Animations
function submitExpenseForm() {
    const btn = document.querySelector('#expense-form .submit-btn');
    
    // Show animated cursor moving to button
    showAnimatedCursor(btn, () => {
        btn.classList.add('processing');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        setTimeout(() => {
            btn.classList.remove('processing');
            btn.classList.add('completed');
            btn.innerHTML = '<i class="fas fa-check"></i> Submitted Successfully';
            
            // Show success screen after a short delay
            setTimeout(() => {
                showSuccessScreen('expense');
            }, 500);
        }, 1500);
    });
}

// Animated cursor function
function showAnimatedCursor(targetElement, callback) {
    // Create cursor element if it doesn't exist
    let cursor = document.getElementById('animatedCursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'animatedCursor';
        cursor.className = 'animated-cursor';
        document.body.appendChild(cursor);
    }
    
    // Get target position
    const rect = targetElement.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    // Start from current position or center
    cursor.style.left = (window.innerWidth / 2) + 'px';
    cursor.style.top = (window.innerHeight / 2) + 'px';
    cursor.classList.add('show');
    
    // Animate to target
    setTimeout(() => {
        cursor.style.transition = 'all 1s ease';
        cursor.style.left = targetX + 'px';
        cursor.style.top = targetY + 'px';
    }, 100);
    
    // Click animation and callback
    setTimeout(() => {
        cursor.classList.add('clicking');
        if (callback) callback();
        
        setTimeout(() => {
            cursor.classList.remove('show', 'clicking');
        }, 500);
    }, 1200);
}

function submitLeaveForm() {
    const btn = document.querySelector('#leave-form .submit-btn');
    
    // Show animated cursor moving to button
    showAnimatedCursor(btn, () => {
        btn.classList.add('processing');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        setTimeout(() => {
            btn.classList.remove('processing');
            btn.classList.add('completed');
            btn.innerHTML = '<i class="fas fa-check"></i> Leave Request Submitted';
            
            // Show success screen after a short delay
            setTimeout(() => {
                showSuccessScreen('leave');
            }, 500);
        }, 1500);
    });
}

// Show Success Screen
function showSuccessScreen(type) {
    let successId = '';
    
    if (type === 'expense') {
        successId = 'expense-success';
    } else if (type === 'leave') {
        successId = 'leave-success';
    } else if (type === 'talent') {
        successId = 'talent-success';
    }
    
    const successScreen = document.getElementById(successId);
    if (successScreen) {
        successScreen.classList.add('show');
        
        // Continue flow after showing success screen - but keep success screen visible
        if (isAutoPlay) {
            setTimeout(() => {
                currentStep++;
                processNextStep();
            }, 1500);
        }
    }
}

// Process Next Step
function processNextStep() {
    if (isPaused) {
        return;
    }
    
    const flow = chatFlows[currentTab];
    
    if (!flow || currentStep >= flow.length) {
        if (isAutoPlay) {
            // Move to next tab
            const tabs = ['expense', 'leave', 'talent'];
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex < tabs.length - 1) {
                setTimeout(() => {
                    if (!isPaused) {
                        switchTab(tabs[currentIndex + 1]);
                    }
                }, 2000);
            } else {
                // Show ROI dashboard
                setTimeout(() => {
                    if (!isPaused) {
                        showROIDashboard();
                    }
                }, 2000);
            }
        }
        return;
    }
    
    const step = flow[currentStep];
    
    if (step.type === 'system') {
        // Execute system action
        if (step.action === 'fillExpenseForm') {
            fillExpenseForm();
        } else if (step.action === 'fillLeaveForm') {
            fillLeaveForm();
        } else if (step.action === 'fillTalentDashboard') {
            fillTalentDashboard();
        } else if (step.action === 'submitExpenseForm') {
            submitExpenseForm();
            // Success screen will handle continuation
            return;
        } else if (step.action === 'submitLeaveForm') {
            submitLeaveForm();
            // Success screen will handle continuation
            return;
        } else if (step.action === 'scheduleTalentInterview') {
            scheduleTalentInterview();
            // Success screen will handle continuation
            return;
        }
        
        currentStep++;
        if (isAutoPlay && !isPaused) {
            setTimeout(() => processNextStep(), 2000);
        }
    } else {
        // Show typing indicator for bot messages
        let typingIndicator = null;
        if (step.type === 'bot' && !step.processing) {
            typingIndicator = showTypingIndicator();
        }
        
        setTimeout(() => {
            if (typingIndicator) {
                removeTypingIndicator(typingIndicator);
            }
            
            // For user messages, show typing in input first
            if (step.type === 'user') {
                typeInChatInput(step.message, () => {
                    addMessage(step.type, step.message, {
                        processing: step.processing,
                        file: step.file,
                        showPreview: step.showPreview
                    });
                    
                    currentStep++;
                    
                    if (isAutoPlay && !isPaused) {
                        const delay = step.processing ? 3000 : 2000;
                        setTimeout(() => processNextStep(), delay);
                    }
                });
            } else {
                addMessage(step.type, step.message, {
                    processing: step.processing,
                    file: step.file,
                    showPreview: step.showPreview
                });
                
                currentStep++;
                
                if (isAutoPlay && !isPaused) {
                    const delay = step.processing ? 3000 : 2000;
                    setTimeout(() => processNextStep(), delay);
                }
            }
        }, step.type === 'bot' ? 800 : 100);
    }
    
    // Update placeholder for manual mode
    if (!isAutoPlay) {
        updateChatInputPlaceholder();
    }
}

// Show Conclusion Overlay (Replaces ROI Dashboard)
function showROIDashboard() {
    // Show conclusion overlay
    const conclusionOverlay = document.getElementById('conclusionOverlay');
    if (conclusionOverlay) {
        // Hide all other interfaces first
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.system-interface').forEach(interface => {
            interface.classList.remove('active');
        });
        
        // Hide upload previews
        const receiptPreview = document.getElementById('receiptPreview');
        const ticketPreview = document.getElementById('ticketPreview');
        const resumePreview = document.getElementById('resumePreview');
        if (receiptPreview) receiptPreview.style.display = 'none';
        if (ticketPreview) ticketPreview.style.display = 'none';
        if (resumePreview) resumePreview.style.display = 'none';
        
        // Clear chat
        clearChat();
        
        // Show conclusion overlay
        conclusionOverlay.classList.add('show');
        
        // Update stage to conclusion
        updateStageIndicator('conclusion');
        
        // Animate metrics after a short delay
        setTimeout(() => {
            animateConclusionMetrics();
        }, 500);
        
        // Resume loop after showing conclusion - LONGER DURATION
        if (isAutoPlay) {
            setTimeout(() => {
                if (isAutoPlay && !isPaused) {
                    // Hide conclusion and restart
                    conclusionOverlay.classList.remove('show');
                    // Smooth restart - go back to expense tab
                    switchTab('expense');
                }
            }, 12000); // Increased from 8000 to 12000 (12 seconds)
        }
        
        // Update indicator
        updateSceneIndicator();
    }
}

// Animate Conclusion Metrics
function animateConclusionMetrics() {
    // No animation needed for text-based metrics
    // They are already displayed in the HTML
}

// Upload Zone
function initializeUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const nextBtn = document.getElementById('nextBtn');
    
    if (uploadZone) {
        uploadZone.addEventListener('click', () => {
            if (!isAutoPlay) {
                fileInput.click();
            }
        });
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('active');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('active');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('active');
            // Simulate file upload
            if (!isAutoPlay) {
                processNextStep();
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (!isAutoPlay) {
                processNextStep();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!isAutoPlay) {
                processNextStep();
            }
        });
    }
}

// Stop Auto-play
function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// Update Scene Indicator (simplified - no progress bar or stage labels)
function updateSceneIndicator() {
    // Function kept for compatibility but simplified
    // No visual indicators to update
}

// Update stage indicator (simplified - no progress bar or stage labels)
function updateStageIndicator(stage) {
    // Function kept for compatibility but simplified
    // No visual indicators to update
}

// Keyboard Controls
function handleKeyPress(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'f':
        case 'F':
            toggleFullscreen();
            break;
        case 'Escape':
            if (document.fullscreenElement) {
                exitFullscreen();
            }
            break;
        case 'Enter':
            if (!isAutoPlay) {
                processNextStep();
            }
            break;
    }
}

// Fullscreen functionality
function toggleFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen();
        document.body.classList.add('presentation-mode');
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i><span>Exit</span>';
    } else {
        // Exit fullscreen
        document.exitFullscreen();
        document.body.classList.remove('presentation-mode');
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i><span>Fullscreen</span>';
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    document.body.classList.remove('presentation-mode');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i><span>Fullscreen</span>';
    }
}

// Listen for fullscreen change events
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        exitFullscreen();
    }
});

// Show Intro Slide
function showIntroSlide(tabName, callback) {
    const introOverlay = document.getElementById('introOverlay');
    const introIcon = document.getElementById('introIcon');
    const introTitle = document.getElementById('introTitle');
    
    // Set icon, title and department benefit based on tab
    let iconClass = '';
    let title = '';
    let overlayClass = '';
    let departmentBenefit = '';
    
    switch(tabName) {
        case 'expense':
            iconClass = 'fas fa-receipt';
            title = 'Expense Claim';
            overlayClass = 'expense';
            departmentBenefit = 'Streamline Finance & Accounting Operations';
            break;
        case 'leave':
            iconClass = 'fas fa-plane-departure';
            title = 'Apply Leave';
            overlayClass = 'leave';
            departmentBenefit = 'Automate HR & People Management';
            break;
        case 'talent':
            iconClass = 'fas fa-users';
            title = 'Talent Match';
            overlayClass = 'talent';
            departmentBenefit = 'Accelerate Talent Acquisition & Recruitment';
            break;
    }
    
    // Update overlay content with department benefit description
    introIcon.className = `intro-icon ${iconClass}`;
    introTitle.innerHTML = `
        ${title}
        <div class="intro-subtitle">${departmentBenefit}</div>
    `;
    
    // Reset overlay classes and add the specific theme
    introOverlay.className = `intro-overlay ${overlayClass}`;
    
    // Show overlay with fade in
    setTimeout(() => {
        introOverlay.classList.add('show');
    }, 50);
    
    // Hide overlay after 2 seconds and call callback
    setTimeout(() => {
        introOverlay.classList.remove('show');
        
        // Wait for fade out transition to complete before calling callback
        setTimeout(() => {
            if (callback) callback();
        }, 500);
    }, 2000);
}

// Type message in chat input (for user messages)
function typeInChatInput(message, callback) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = '';
    chatInput.focus();
    
    // Decode HTML entities to get clean text for typing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message;
    const cleanMessage = tempDiv.textContent || tempDiv.innerText || message;
    
    let i = 0;
    function typeChar() {
        if (i < cleanMessage.length) {
            chatInput.value += cleanMessage.charAt(i);
            i++;
            setTimeout(typeChar, 50); // 50ms per character
        } else {
            // After typing is complete, wait a moment then clear and call callback
            setTimeout(() => {
                chatInput.value = '';
                chatInput.blur();
                if (callback) callback();
            }, 500);
        }
    }
    
    typeChar();
}

// Mobile Auto-Scroll Functions
function isMobile() {
    return window.innerWidth <= 768;
}

function scrollToChat() {
    if (isMobile()) {
        const chatPanel = document.querySelector('.chatbot-panel');
        if (chatPanel) {
            chatPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            chatPanel.classList.add('scroll-to-chat');
            setTimeout(() => chatPanel.classList.remove('scroll-to-chat'), 1000);
        }
    }
}

function scrollToSystem() {
    if (isMobile()) {
        const systemPanel = document.querySelector('.system-panel');
        if (systemPanel) {
            systemPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            systemPanel.classList.add('scroll-to-system');
            setTimeout(() => systemPanel.classList.remove('scroll-to-system'), 1000);
        }
    }
}

function scrollToUploadPreview() {
    if (isMobile()) {
        const activePreview = document.querySelector('.upload-preview[style*="block"]');
        if (activePreview) {
            activePreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function scrollToSubmitButton() {
    if (isMobile()) {
        const activeSystem = document.querySelector('.system-interface.active');
        const submitBtn = activeSystem?.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Schedule Talent Interview
function scheduleTalentInterview() {
    // Simulate scheduling animation
    setTimeout(() => {
        showSuccessScreen('talent');
    }, 1500);
}
