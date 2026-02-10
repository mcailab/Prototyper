document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('cursor');
    let isPaused = false;

    // Data Mock (Mirroring your Python logic)
    const MOCK_BALANCE = "1,542,000.00 SGD";
    const MOCK_LISTING = [
        { mask: "888-***-001", bal: "1,542,000.00", id: "acct_001_sg" },
        { mask: "888-***-002", bal: "50,230.50", id: "acct_002_usd" },
        { mask: "888-***-003", bal: "12,000.00", id: "acct_003_eur" }
    ];
    const MOCK_HISTORY = [
        { date: "10-Feb-2026", desc: "INWARD TRANSFER - PAYNOW", amt: "+5,000.00", type: "in" },
        { date: "09-Feb-2026", desc: "GIRO PAYMENT - SUPPLIER A", amt: "-2,450.00", type: "out" },
        { date: "08-Feb-2026", desc: "SERVICE FEE", amt: "-15.00", type: "out" }
    ];

    // Helper: Move Cursor & Click
    async function simulateAction(targetSelector, actionType = 'click', text = '') {
        if (isPaused) await waitForPlay();
        
        const el = document.querySelector(targetSelector);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        
        // Show cursor
        cursor.style.display = 'block';
        cursor.style.left = (rect.left + rect.width / 2) + 'px';
        cursor.style.top = (rect.top + rect.height / 2) + 'px';

        await new Promise(r => setTimeout(r, 800)); // Movement time

        if (actionType === 'click') {
            cursor.classList.add('click');
            el.classList.add('active'); // mimic hover/active
            await new Promise(r => setTimeout(r, 200));
            cursor.classList.remove('click');
            el.click(); // Trigger actual click logic
        } else if (actionType === 'type') {
            el.focus();
            // Simple typing simulation visual only since inputs are readonly
            el.style.border = "2px solid var(--accent)";
            await new Promise(r => setTimeout(r, 500));
            el.style.border = "1px solid #ddd";
        }
        
        await new Promise(r => setTimeout(r, 1000)); // Wait after action
    }

    // Helper: Wait for Play
    function waitForPlay() {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (!isPaused) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    // --- UI Logic Binding ---
    
    // Tab Switching
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-' + item.dataset.tab).classList.add('active');
        });
    });

    // 1. Balance Logic
    document.getElementById('btnBalance').addEventListener('click', async () => {
        const resArea = document.getElementById('resBalance');
        resArea.innerHTML = '<div style="color:#666"><i class="fas fa-circle-notch fa-spin"></i> Calling API: /accountbalance/1.0/balance...</div>';
        await new Promise(r => setTimeout(r, 1500)); // Fake latency
        resArea.innerHTML = `
            <div class="metric-card">
                <div class="metric-label">Available Balance</div>
                <div class="metric-value">${MOCK_BALANCE}</div>
            </div>`;
    });

    // 2. Listing Logic
    document.getElementById('btnListing').addEventListener('click', async () => {
        const resArea = document.getElementById('resListing');
        resArea.innerHTML = '<div style="color:#666"><i class="fas fa-circle-notch fa-spin"></i> Fetching /corporateAccountListing...</div>';
        await new Promise(r => setTimeout(r, 1500));
        
        let rows = MOCK_LISTING.map(acc => `
            <tr>
                <td>${acc.mask}</td>
                <td>${acc.bal}</td>
                <td style="font-family:monospace;color:#666">${acc.id}</td>
            </tr>
        `).join('');
        
        resArea.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Masked Number</th><th>Balance</th><th>Account ID</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    });

    // 3. History Logic
    document.getElementById('btnHistory').addEventListener('click', async () => {
        const resArea = document.getElementById('resHistory');
        resArea.innerHTML = '<div style="color:#666"><i class="fas fa-circle-notch fa-spin"></i> Querying /corpTransHistory...</div>';
        await new Promise(r => setTimeout(r, 2000));
        
        let rows = MOCK_HISTORY.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td>${tx.desc}</td>
                <td><span class="${tx.type === 'in' ? 'badge-in' : 'badge-out'}">${tx.amt}</span></td>
            </tr>
        `).join('');
        
        resArea.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    });

    // --- Main Demo Sequence ---
    async function runDemo() {
        // Intro
        await new Promise(r => setTimeout(r, 2000));
        document.getElementById('introOverlay').classList.add('hide');
        await new Promise(r => setTimeout(r, 1000));

        // Sequence 1: Check Balance
        await simulateAction('.menu-item[data-tab="balance"]'); // Click tab (redundant but shows flow)
        await simulateAction('#accInput', 'type'); // Simulate focus
        await simulateAction('#btnBalance'); // Click Query

        // Sequence 2: Check Listing
        await simulateAction('.menu-item[data-tab="listing"]');
        await simulateAction('#btnListing');

        // Sequence 3: Check History
        await simulateAction('.menu-item[data-tab="history"]');
        await simulateAction('#historySelect'); // Click Dropdown
        document.getElementById('historySelect').innerText = "888-***-001 (Main)"; // Fake selection change
        await new Promise(r => setTimeout(r, 500));
        await simulateAction('#btnHistory');

        // End Loop
        await new Promise(r => setTimeout(r, 3000));
        location.reload(); // Restart demo
    }

    // Play/Pause Control
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        isPaused = !isPaused;
        this.innerHTML = isPaused ? '<i class="fas fa-play"></i> <span>Play</span>' : '<i class="fas fa-pause"></i> <span>Pause</span>';
    });

    // Start
    runDemo();
});