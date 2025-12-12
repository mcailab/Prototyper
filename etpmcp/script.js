// OAuth MCP Demo Script
(function() {
    // Demo configuration
    const config = {
        sceneTimings: {
            opening: 3000,
            scene1: 10000,  // Authentication
            scene2: 10000,  // Authorization
            scene3: 10000,  // Accounting
            conclusion: 5000
        },
        autoplay: true,
        currentScene: 'opening'
    };

    // State management
    let isPlaying = true;
    let isPaused = false;
    let currentTab = null;
    let animationTimer = null;
    let progressInterval = null;
    let startTime = 0;
    let totalDuration = 0;
    let autoStartTimer = null; // Track opening auto-start timer
    let sceneTimers = []; // Track all scene timers

    // DOM Elements
    const elements = {
        openingOverlay: document.getElementById('openingOverlay'),
        conclusionOverlay: document.getElementById('conclusionOverlay'),
        scenes: document.querySelectorAll('.scene'),
        progressFill: document.getElementById('progressFill'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        
        // Scene 1 elements
        authMessages: document.getElementById('authMessages'),
        oauthPopup: document.getElementById('oauthPopup'),
        googleAuth: document.getElementById('googleAuth'),
        microsoftAuth: document.getElementById('microsoftAuth'),
        
        // Scene 2 elements
        adminToolsBtn: document.getElementById('adminToolsBtn'),
        userToolsBtn: document.getElementById('userToolsBtn'),
        adminToolsPopup: document.getElementById('adminToolsPopup'),
        userToolsPopup: document.getElementById('userToolsPopup'),
        
        // Scene 3 elements
        activityFeed: document.getElementById('activityFeed')
    };

    // Calculate total duration
    Object.values(config.sceneTimings).forEach(time => {
        totalDuration += time;
    });

    // Initialize demo
    function init() {
        setupEventListeners();
        setupTabClickHandlers();
        if (config.autoplay) {
            showOpeningWithTabs();
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Play/Pause button
        elements.playPauseBtn.addEventListener('click', togglePlayPause);
        
        // Fullscreen button
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // OAuth buttons
        elements.googleAuth?.addEventListener('click', handleGoogleAuth);
        elements.microsoftAuth?.addEventListener('click', handleMicrosoftAuth);
        
        // MCP Tools buttons
        elements.adminToolsBtn?.addEventListener('click', () => toggleToolsPopup('admin'));
        elements.userToolsBtn?.addEventListener('click', () => toggleToolsPopup('user'));
    }

    // Show opening with clickable tabs
    function showOpeningWithTabs() {
        elements.openingOverlay.style.display = 'flex';
        elements.openingOverlay.classList.remove('hide');
        
        // Clear any existing auto-start timer
        if (autoStartTimer) {
            clearTimeout(autoStartTimer);
        }
        
        // Auto-start after opening if not paused
        autoStartTimer = setTimeout(() => {
            if (isPlaying && !isPaused) {
                switchToTab('authentication');
            }
        }, config.sceneTimings.opening);
    }
    
    // Setup tab click handlers
    function setupTabClickHandlers() {
        // Opening tabs
        const authTab = document.querySelector('.authentication-tab');
        const authzTab = document.querySelector('.authorization-tab');
        const acctTab = document.querySelector('.accounting-tab');
        
        if (authTab) {
            authTab.addEventListener('click', () => {
                clearAllTimers();
                switchToTab('authentication');
            });
        }
        if (authzTab) {
            authzTab.addEventListener('click', () => {
                clearAllTimers();
                switchToTab('authorization');
            });
        }
        if (acctTab) {
            acctTab.addEventListener('click', () => {
                clearAllTimers();
                switchToTab('accounting');
            });
        }
    }
    
    // Clear all timers to prevent conflicts
    function clearAllTimers() {
        // Clear main animation timer
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }
        
        // Clear auto-start timer
        if (autoStartTimer) {
            clearTimeout(autoStartTimer);
            autoStartTimer = null;
        }
        
        // Clear all scene timers
        sceneTimers.forEach(timer => clearTimeout(timer));
        sceneTimers = [];
        
        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Clear all other timeouts
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
    }
    
    // Switch to a specific tab with intro slide
    function switchToTab(tabName) {
        // Prevent duplicate switches
        if (currentTab === tabName) return;
        
        currentTab = tabName;
        
        // Clear any existing animations
        clearAllTimers();
        
        // Hide opening
        hideOpening();
        
        // Hide any existing intro overlays
        const introOverlay = document.getElementById('introOverlay');
        introOverlay.classList.remove('show');
        
        // Show intro slide first
        showIntroSlide(tabName, () => {
            // After intro, show the corresponding scene
            switch(tabName) {
                case 'authentication':
                    showScene('scene1');
                    animateScene1();
                    break;
                case 'authorization':
                    showScene('scene2');
                    animateScene2();
                    break;
                case 'accounting':
                    showScene('scene3');
                    animateScene3();
                    break;
            }
        });
    }
    
    // Show intro slide for each section
    function showIntroSlide(tabName, callback) {
        const introOverlay = document.getElementById('introOverlay');
        const introIcon = document.getElementById('introIcon');
        const introTitle = document.getElementById('introTitle');
        
        let iconClass = '';
        let title = '';
        let subtitle = '';
        let overlayClass = '';
        
        switch(tabName) {
            case 'authentication':
                iconClass = 'bx bx-user-check';
                title = 'Authentication';
                subtitle = 'Secure Identity Verification';
                overlayClass = 'authentication';
                break;
            case 'authorization':
                iconClass = 'bx bx-lock';
                title = 'Authorization';
                subtitle = 'Role-Based Access Control';
                overlayClass = 'authorization';
                break;
            case 'accounting':
                iconClass = 'bx bx-line-chart';
                title = 'Accounting';
                subtitle = 'Complete Activity Tracking';
                overlayClass = 'accounting';
                break;
        }
        
        // Update overlay content
        introIcon.className = `intro-icon ${iconClass}`;
        introTitle.innerHTML = `
            ${title}
            <div class="intro-subtitle">${subtitle}</div>
        `;
        
        // Reset overlay classes and add theme
        introOverlay.className = `intro-overlay ${overlayClass}`;
        
        // Show overlay with fade in
        setTimeout(() => {
            introOverlay.classList.add('show');
        }, 50);
        
        // Hide overlay after 2 seconds
        setTimeout(() => {
            introOverlay.classList.remove('show');
            
            // Wait for fade out transition
            setTimeout(() => {
                if (callback) callback();
            }, 500);
        }, 2000);
    }
    
    // Start the demo
    function startDemo() {
        isPlaying = true;
        isPaused = false;
        updatePlayPauseButton();
        startTime = Date.now();
        updateProgress();
        
        if (!currentTab) {
            showOpeningWithTabs();
        } else {
            // Resume from current scene
            resumeFromCurrentScene();
        }
    }

    // Hide opening overlay
    function hideOpening() {
        elements.openingOverlay.classList.add('hide');
    }

    // Show specific scene
    function showScene(sceneId) {
        elements.scenes.forEach(scene => {
            scene.classList.remove('active');
        });
        const scene = document.getElementById(sceneId);
        if (scene) {
            scene.classList.add('active');
        }
        config.currentScene = sceneId;
    }

    // Scene 1: Authentication animation
    function animateScene1() {
        if (!isPlaying) return;
        
        // Clear previous messages
        elements.authMessages.innerHTML = '';
        
        // User message after 1s
        setTimeout(() => {
            if (!isPlaying) return;
            addChatMessage('user', 'I need to access MCP tools', elements.authMessages);
        }, 1000);
        
        // Claude response after 2s
        setTimeout(() => {
            if (!isPlaying) return;
            addChatMessage('claude', 'Please authenticate to access MCP tools', elements.authMessages);
        }, 2500);
        
        // Show OAuth popup after 3.5s
        setTimeout(() => {
            if (!isPlaying) return;
            elements.oauthPopup.classList.add('show');
        }, 3500);
        
        // Simulate Google auth click after 6s
        setTimeout(() => {
            if (!isPlaying) return;
            simulateAuthClick('google');
        }, 6000);
        
        // Move to Scene 2 after scene duration
        animationTimer = setTimeout(() => {
            if (!isPlaying) return;
            
            // Wait for success screen to be visible for 3 seconds before transitioning
            setTimeout(() => {
                elements.oauthPopup.classList.remove('show');
                
                // Auto-advance with intro slide
                showIntroSlide('authorization', () => {
                    showScene('scene2');
                    animateScene2();
                });
            }, 3000); // Give 3 seconds to show success screen
        }, config.sceneTimings.scene1);
    }

    // Scene 2: Authorization animation
    function animateScene2() {
        if (!isPlaying) return;
        
        // Clear all messages from both chat panels first
        const adminMessages = document.querySelector('.admin-panel .chat-messages');
        const userMessages = document.querySelector('.user-panel:not(.admin-panel) .chat-messages');
        
        // Clear admin chat completely
        if (adminMessages) {
            adminMessages.innerHTML = '';
        }
        
        // Clear user chat completely
        if (userMessages) {
            userMessages.innerHTML = '';
        }
        
        // Clear both input fields
        const adminInput = document.querySelector('.admin-panel .chat-input-bar input');
        const userInput = document.querySelector('.user-panel:not(.admin-panel) .chat-input-bar input');
        if (adminInput) adminInput.value = '';
        if (userInput) userInput.value = '';
        
        // Start with Sarah's panel - animate typing for admin first
        setTimeout(() => {
            if (!isPlaying) return;
            if (adminInput) {
                typeMessage(adminInput, 'Show me available MCP tools', () => {
                    // After typing is complete, add the message to chat
                    const userMsg = document.createElement('div');
                    userMsg.className = 'message user';
                    userMsg.innerHTML = '<div class="message-content">Show me available MCP tools</div>';
                    adminMessages.appendChild(userMsg);
                    adminMessages.scrollTop = adminMessages.scrollHeight;
                    
                    // After showing user message, show Claude's response
                    setTimeout(() => {
                        if (!isPlaying) return;
                        addMcpToolsMessageWithAnimation('admin');
                    }, 800);
                });
            }
        }, 1000);
        
        // Then John's panel - animate typing for user after admin is done
        setTimeout(() => {
            if (!isPlaying) return;
            if (userInput) {
                typeMessage(userInput, 'Show me available MCP tools', () => {
                    // After typing is complete, add the message to chat
                    const userMsg = document.createElement('div');
                    userMsg.className = 'message user';
                    userMsg.innerHTML = '<div class="message-content">Show me available MCP tools</div>';
                    userMessages.appendChild(userMsg);
                    userMessages.scrollTop = userMessages.scrollHeight;
                    
                    // After showing user message, show Claude's response
                    setTimeout(() => {
                        if (!isPlaying) return;
                        addMcpToolsMessageWithAnimation('user');
                    }, 800);
                });
            }
        }, 5000);
        
        // Move to Scene 3 after delay
        animationTimer = setTimeout(() => {
            if (!isPlaying) return;
            
            // Add 3-second pause before advancing
            setTimeout(() => {
                if (!isPlaying) return;
                
                // Auto-advance with intro slide
                showIntroSlide('accounting', () => {
                    showScene('scene3');
                    animateScene3();
                });
            }, 3000); // 3 second pause after authorization
        }, config.sceneTimings.scene2);
    }
    
    // Helper function to type message character by character
    function typeMessage(input, text, callback) {
        let index = 0;
        const typingInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(typingInterval);
                input.value = text;
                if (callback) callback();
                return;
            }
            
            if (index < text.length) {
                input.value = text.substring(0, index + 1);
                index++;
            } else {
                clearInterval(typingInterval);
                if (callback) callback();
            }
        }, 50); // Typing speed
    }
    
    // Add MCP tools message with animation
    function addMcpToolsMessageWithAnimation(userType) {
        const adminContainer = document.querySelector('.admin-panel .chat-messages');
        const userContainer = document.querySelector('.user-panel:not(.admin-panel) .chat-messages');
        
        if (userType === 'admin' && adminContainer) {
            // First add "Here are your available MCP tools:" message
            const introMessage = document.createElement('div');
            introMessage.className = 'message claude';
            introMessage.innerHTML = '<div class="message-content">Here are your available MCP tools:</div>';
            adminContainer.appendChild(introMessage);
            adminContainer.scrollTop = adminContainer.scrollHeight;
            
            // Then add tools message after a short delay
            setTimeout(() => {
                addMcpToolsMessage('admin');
            }, 300);
        } else if (userType === 'user' && userContainer) {
            // First add "Here are your available MCP tools:" message
            const introMessage = document.createElement('div');
            introMessage.className = 'message claude';
            introMessage.innerHTML = '<div class="message-content">Here are your available MCP tools with your current permissions:</div>';
            userContainer.appendChild(introMessage);
            userContainer.scrollTop = userContainer.scrollHeight;
            
            // Then add tools message after a short delay
            setTimeout(() => {
                addMcpToolsMessage('user');
            }, 300);
        }
    }

    // Helper function to add MCP tools as chat message
    function addMcpToolsMessage(userType) {
        const adminContainer = document.querySelector('.admin-panel .chat-messages');
        const userContainer = document.querySelector('.user-panel:not(.admin-panel) .chat-messages');
        
        // Clear any existing tools messages first to prevent duplicates
        const existingToolsMessages = document.querySelectorAll('.message .tools-message');
        existingToolsMessages.forEach(msg => {
            if (msg.closest('.admin-panel') && userType === 'admin') {
                msg.closest('.message').remove();
            } else if (!msg.closest('.admin-panel') && userType === 'user') {
                msg.closest('.message').remove();
            }
        });
        
        if (userType === 'admin' && adminContainer) {
            const toolsMessage = `
                <div class="message claude">
                    <div class="message-content tools-message">
                        <div class="inline-tools-header">MCP Tools - Full Access</div>
                        <div class="inline-tools-list">
                            <div class="inline-tool-item available">
                                <i class='bx bx-data'></i>
                                <span>Database Manager</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item available">
                                <i class='bx bx-plug'></i>
                                <span>API Gateway</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item available">
                                <i class='bx bx-folder'></i>
                                <span>File System</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item available">
                                <i class='bx bx-cloud'></i>
                                <span>Cloud Deploy</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item available">
                                <i class='bx bx-lock-alt'></i>
                                <span>Security Config</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            adminContainer.innerHTML += toolsMessage;
            adminContainer.scrollTop = adminContainer.scrollHeight;
        } else if (userType === 'user' && userContainer) {
            const toolsMessage = `
                <div class="message claude">
                    <div class="message-content tools-message">
                        <div class="inline-tools-header">MCP Tools - Limited Access</div>
                        <div class="inline-tools-list">
                            <div class="inline-tool-item available">
                                <i class='bx bx-data'></i>
                                <span>Database Manager</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item available">
                                <i class='bx bx-plug'></i>
                                <span>API Gateway</span>
                                <i class='bx bx-check-circle'></i>
                            </div>
                            <div class="inline-tool-item locked">
                                <i class='bx bx-folder'></i>
                                <span>File System</span>
                                <i class='bx bx-x-circle' style="color: var(--errorColor);"></i>
                            </div>
                            <div class="inline-tool-item locked">
                                <i class='bx bx-cloud'></i>
                                <span>Cloud Deploy</span>
                                <i class='bx bx-x-circle' style="color: var(--errorColor);"></i>
                            </div>
                            <div class="inline-tool-item locked">
                                <i class='bx bx-lock-alt'></i>
                                <span>Security Config</span>
                                <i class='bx bx-x-circle' style="color: var(--errorColor);"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            userContainer.innerHTML += toolsMessage;
            userContainer.scrollTop = userContainer.scrollHeight;
        }
    }

    // Scene 3: Accounting animation
    function animateScene3() {
        if (!isPlaying) return;
        
        // Clear activity feed
        elements.activityFeed.innerHTML = '';
        
        // Add activity items progressively
        const activities = [
            { time: '4:05 PM', user: 'Sarah Chen', action: 'Executed: Database backup', status: 'Success' },
            { time: '4:03 PM', user: 'John Doe', action: 'Queried: Customer records (Read)', status: 'Success' },
            { time: '4:02 PM', user: 'Sarah Chen', action: 'Deployed: API v2.1', status: 'Success' },
            { time: '4:00 PM', user: 'John Doe', action: 'Attempted: File write', status: 'Denied' }
        ];
        
        activities.forEach((activity, index) => {
            setTimeout(() => {
                if (!isPlaying) return;
                addActivityItem(activity);
            }, (index + 1) * 1500);
        });
        
        // Animate chart bars
        setTimeout(() => {
            if (!isPlaying) return;
            animateChartBars();
        }, 2000);
        
        // Show conclusion after 3 second delay
        animationTimer = setTimeout(() => {
            if (!isPlaying) return;
            // Add 3-second pause before showing conclusion
            setTimeout(() => {
                if (!isPlaying) return;
                showConclusion();
            }, 3000); // 3 second pause before conclusion
        }, config.sceneTimings.scene3);
    }

    // Show conclusion overlay
    function showConclusion() {
        elements.conclusionOverlay.classList.add('show');
        
        // Reset demo after conclusion
        animationTimer = setTimeout(() => {
            if (!isPlaying) return;
            resetDemo();
        }, config.sceneTimings.conclusion);
    }

    // Reset demo to beginning
    function resetDemo() {
        // Clear all timers first
        clearAllTimers();
        
        // Hide conclusion
        elements.conclusionOverlay.classList.remove('show');
        
        // Reset all scenes
        elements.scenes.forEach(scene => {
            scene.classList.remove('active');
        });
        
        // Clear dynamic content
        elements.authMessages.innerHTML = '';
        elements.activityFeed.innerHTML = '';
        elements.oauthPopup.classList.remove('show');
        elements.adminToolsPopup?.classList.remove('show');
        elements.userToolsPopup?.classList.remove('show');
        
        // Clear scene 2 messages completely
        const adminMessages = document.querySelector('.admin-panel .chat-messages');
        const userMessages = document.querySelector('.user-panel:not(.admin-panel) .chat-messages');
        if (adminMessages) {
            adminMessages.innerHTML = '';
        }
        if (userMessages) {
            userMessages.innerHTML = '';
        }
        
        // Reset current tab
        currentTab = null;
        config.currentScene = 'opening';
        
        // Show opening again
        elements.openingOverlay.style.display = 'flex';
        elements.openingOverlay.classList.remove('hide');
        
        // Restart if still playing
        if (isPlaying) {
            showOpeningWithTabs();
        }
    }

    // Helper function to add chat messages
    function addChatMessage(type, content, container) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    // Helper function to add activity items
    function addActivityItem(activity) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'activity-item';
        itemDiv.innerHTML = `
            <span class="activity-time">${activity.time}</span>
            <span class="activity-user">${activity.user}</span>
            <span class="activity-action">${activity.action}</span>
            <span class="activity-status ${activity.status.toLowerCase()}">${activity.status}</span>
        `;
        elements.activityFeed.appendChild(itemDiv);
    }

    // Simulate authentication click
    function simulateAuthClick(provider) {
        const button = provider === 'google' ? elements.googleAuth : elements.microsoftAuth;
        
        // Visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
        
        // Show Google account selection if Google
        if (provider === 'google') {
            setTimeout(() => {
                elements.oauthPopup.innerHTML = `
                    <div class="popup-header">
                        <svg viewBox="0 0 24 24" width="40" height="40" style="margin: 0 auto 15px; display: block;">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <h3>Choose an account</h3>
                    </div>
                    <div class="popup-content">
                        <div class="auth-buttons" style="border: none; padding: 0; box-shadow: none;">
                            <div class="google-account-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--borderColor); border-radius: 8px; cursor: pointer; margin-bottom: 10px;" onclick="this.style.background='var(--inputBg)'">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--mainColor); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">SC</div>
                                <div style="flex: 1; text-align: left;">
                                    <div style="font-weight: 500; color: var(--darkText);">Sarah Chen</div>
                                    <div style="font-size: 0.85rem; color: var(--lightText);">sarah.chen@company.com</div>
                                </div>
                            </div>
                            <div class="google-account-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--borderColor); border-radius: 8px; cursor: pointer;" onclick="this.style.background='var(--inputBg)'">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: #9ca3af; display: flex; align-items: center; justify-content: center; color: white;">+</div>
                                <div style="flex: 1; text-align: left;">
                                    <div style="color: var(--darkText);">Use another account</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Simulate account selection after delay
                setTimeout(() => {
                    showAuthorizationScreen();
                }, 1500);
            }, 500);
        } else {
            setTimeout(() => {
                showAuthLoading();
            }, 500);
        }
    }
    
    // Show authorization screen
    function showAuthorizationScreen() {
        elements.oauthPopup.innerHTML = `
            <div class="popup-header">
                <svg viewBox="0 0 24 24" width="40" height="40" style="margin: 0 auto 15px; display: block;">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h3 style="color: var(--darkText); margin-bottom: 5px;">Enterprise MCP Connector</h3>
                <p style="font-size: 0.9rem; color: var(--lightText); margin: 0;">wants to access your MCP resources</p>
            </div>
            <div class="popup-content">
                <div style="background: var(--inputBg); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--mainColor); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; font-weight: 600;">SC</div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; font-weight: 500; color: var(--darkText);">Sarah Chen</div>
                            <div style="font-size: 0.75rem; color: var(--lightText);">sarah.chen@company.com</div>
                        </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid var(--borderColor); margin: 12px 0;">
                    <div style="font-size: 0.85rem; color: var(--darkText); font-weight: 500; margin-bottom: 8px;">This will allow Enterprise MCP to:</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--lightText);">
                            <i class='bx bx-check' style="color: var(--successColor); font-size: 1rem;"></i>
                            <span>Access MCP server tools and resources</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--lightText);">
                            <i class='bx bx-check' style="color: var(--successColor); font-size: 1rem;"></i>
                            <span>Execute authorized MCP commands</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--lightText);">
                            <i class='bx bx-check' style="color: var(--successColor); font-size: 1rem;"></i>
                            <span>Monitor and log your MCP activity</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="flex: 1; padding: 10px; border: 1px solid var(--borderColor); background: var(--whiteBg); border-radius: 6px; color: var(--darkText); cursor: pointer;">Cancel</button>
                    <button id="authorizeBtn" style="flex: 1; padding: 10px; border: none; background: #4285F4; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">Authorize</button>
                </div>
            </div>
        `;
        
        // Add click handler for authorize button
        setTimeout(() => {
            const authorizeBtn = document.getElementById('authorizeBtn');
            if (authorizeBtn) {
                authorizeBtn.addEventListener('click', () => {
                    showAuthLoading();
                });
            }
        }, 100);
        
        // Auto-click after 2 seconds for demo
        setTimeout(() => {
            showAuthLoading();
        }, 2000);
    }
    
    // Show loading state
    function showAuthLoading() {
        elements.oauthPopup.innerHTML = `
            <div class="popup-header">
                <div style="width: 50px; height: 50px; margin: 0 auto 15px; 
                            border: 3px solid rgba(0, 191, 255, 0.3); 
                            border-radius: 50%; 
                            border-top-color: var(--mainColor);
                            animation: spin 1s linear infinite;"></div>
                <h3>Authenticating...</h3>
            </div>
        `;
        
        // Show success
        setTimeout(() => {
            elements.oauthPopup.innerHTML = `
                <div class="popup-header">
                    <i class='bx bx-check-circle' style="color: var(--successColor); font-size: 3rem;"></i>
                    <h3>Authentication Successful!</h3>
                    <p style="color: var(--lightText); margin-top: 10px;">Welcome, Sarah Chen</p>
                </div>
            `;
            
            // Enable chat input
            const chatInput = document.querySelector('.chat-input-bar input');
            const mcpBtn = document.querySelector('.mcp-tools-btn');
            const sendBtn = document.querySelector('.send-btn');
            if (chatInput) chatInput.disabled = false;
            if (mcpBtn) mcpBtn.classList.remove('disabled');
            if (sendBtn) sendBtn.classList.remove('disabled');
        }, 1500);
    }

    // Toggle MCP tools popup
    function toggleToolsPopup(user) {
        const popup = user === 'admin' ? elements.adminToolsPopup : elements.userToolsPopup;
        popup.classList.toggle('show');
        
        // Hide after 3s if showing
        if (popup.classList.contains('show')) {
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }
    }

    // Animate chart bars
    function animateChartBars() {
        const bars = document.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.animation = 'none';
                setTimeout(() => {
                    bar.style.animation = 'growBar 1s ease';
                }, 10);
            }, index * 200);
        });
    }

    // Toggle play/pause
    function togglePlayPause() {
        isPlaying = !isPlaying;
        updatePlayPauseButton();
        
        if (!isPlaying) {
            // Pause all animations
            clearTimeout(animationTimer);
            clearInterval(progressInterval);
        } else {
            // Resume from current scene
            resumeFromCurrentScene();
        }
    }

    // Update play/pause button
    function updatePlayPauseButton() {
        const icon = elements.playPauseBtn.querySelector('i');
        const text = elements.playPauseBtn.querySelector('span');
        
        if (isPlaying) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Pause';
            elements.playPauseBtn.classList.add('active');
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Play';
            elements.playPauseBtn.classList.remove('active');
        }
    }

    // Resume animation from current scene
    function resumeFromCurrentScene() {
        // Don't update progress or restart if paused
        if (!isPlaying) return;
        
        updateProgress();
        
        // Resume based on current scene without restarting from beginning
        switch(config.currentScene) {
            case 'opening':
                // If still on opening, just wait for auto-advance
                if (!autoStartTimer) {
                    showOpeningWithTabs();
                }
                break;
            case 'scene1':
                // Continue scene 1 without restarting
                break;
            case 'scene2':
                // Continue scene 2 without restarting
                break;
            case 'scene3':
                // Continue scene 3 without restarting
                break;
        }
    }

    // Toggle fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.body.classList.add('fullscreen');
            elements.fullscreenBtn.querySelector('i').className = 'fas fa-compress';
            elements.fullscreenBtn.querySelector('span').textContent = 'Exit Fullscreen';
        } else {
            document.exitFullscreen();
            document.body.classList.remove('fullscreen');
            elements.fullscreenBtn.querySelector('i').className = 'fas fa-expand';
            elements.fullscreenBtn.querySelector('span').textContent = 'Fullscreen';
        }
    }

    // Update progress bar
    function updateProgress() {
        if (!isPlaying) return;
        
        progressInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 100);
            elements.progressFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 100);
    }

    // Handle Google authentication
    function handleGoogleAuth(e) {
        e.preventDefault();
        simulateAuthClick('google');
    }

    // Handle Microsoft authentication
    function handleMicrosoftAuth(e) {
        e.preventDefault();
        simulateAuthClick('microsoft');
    }

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
