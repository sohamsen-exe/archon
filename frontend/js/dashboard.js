const API_BASE = 'http://localhost:5000/api';
const role = localStorage.getItem('role');

if (!role) window.location.href = 'login.html';

let globalUsers = [];

// Predefined subjects based on department
const departmentSubjects = {
    "Computer Science": ["Data Structures", "Algorithms", "Operating Systems", "Database Systems", "Software Engineering"],
    "Information Technology": ["Networking", "Cybersecurity", "Web Development", "System Admin", "Cloud Computing"],
    "Business": ["Accounting", "Corporate Finance", "Marketing", "Business Ethics", "Microeconomics"],
    "Mathematics": ["Calculus I", "Linear Algebra", "Discrete Math", "Statistics", "Differential Equations"]
};

// Function to add a dynamic grade row
function addGradeRow(subject = '', grade = '') {
    const container = document.getElementById('grades-list-inputs');
    const currentDept = document.getElementById('edit-department').value;
    const availableSubjects = departmentSubjects[currentDept] || [];

    const row = document.createElement('div');
    row.className = 'grade-row';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';

    // Generate dropdown options based on department
    let subjectOptions = availableSubjects.map(s => `<option value="${s}" ${s === subject ? 'selected' : ''}>${s}</option>`).join('');
    
    // If a subject exists that isn't in the default list, keep it
    if (subject && !availableSubjects.includes(subject)) {
        subjectOptions += `<option value="${subject}" selected>${subject}</option>`;
    }

    row.innerHTML = `
        <select class="edit-subject form-control" style="flex: 2; margin: 0;">
            <option value="" disabled ${!subject ? 'selected' : ''}>Select Subject...</option>
            ${subjectOptions}
        </select>
        <input type="text" class="edit-grade form-control" placeholder="Grade" value="${grade}" style="flex: 1; margin: 0;">
        <button type="button" class="remove-grade-btn" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 0 12px; cursor: pointer; font-weight: bold;">X</button>
    `;

    // Attach remove event
    row.querySelector('.remove-grade-btn').onclick = () => row.remove();
    container.appendChild(row);
}

// Helper to format grades securely
function formatGrades(grades) {
    if (!grades || grades.length === 0) return '<span style="color:#888;">No records</span>';
    return grades.map(g => `<b>${g.subject}:</b> ${g.grade}`).join(', ');
    
}

// TOGGLE FUNCTION for Student ID box
function toggleEditStudentId() {
    const roleSelect = document.getElementById('edit-role');
    const container = document.getElementById('edit-studentId-container');
    const gradesContainer = document.getElementById('edit-grades-container');
    
    if (roleSelect && container) {
        const isStudent = roleSelect.value === 'user';
        container.style.display = isStudent ? 'block' : 'none';
        if(gradesContainer) gradesContainer.style.display = isStudent ? 'block' : 'none';
    }
}

async function fetchDashboardData() {
    const endpoint = (role === 'admin') ? '/protected/admin' : '/protected/user';
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        
        if (data.users) globalUsers = data.users;
        renderDashboard(data);
    } catch (err) {
        console.error("Fetch failed", err);
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

function renderDashboard(data) {
    const panel = document.getElementById('data-panel');
    const titleEl = document.getElementById('page-title');
    
    if (!panel || !titleEl) return;

    // Set Dynamic Dashboard Title
    const displayRole = role === 'user' ? 'Student' : role.charAt(0).toUpperCase() + role.slice(1);
    titleEl.innerHTML = `${displayRole} Dashboard`;
    
    panel.style.display = 'block';
    let html = "";

    if (role === 'admin') {
        const depts = [...new Set(data.users.map(u => u.department).filter(d => d))];
        
        // 1. System Overview & Active Sessions
        html += `
            <div class="alert-info">
                <h4 style="margin-top:0;">System Overview</h4>
                <p style="margin:5px 0 0 0;">Total Registered Users: <strong>${data.users.length}</strong></p>
            </div>

            <h3 style="margin-top:30px;">Active Sessions</h3>
            <table>
                <thead><tr><th>Username</th><th>Role</th></tr></thead>
                <tbody>
                    ${(data.activeSessions && data.activeSessions.length > 0) 
                        ? data.activeSessions.map(s => `<tr><td><strong>${s.username}</strong></td><td><span class="badge" style="background:#17a2b8;">${s.role}</span></td></tr>`).join('') 
                        : '<tr><td colspan="2">No active sessions found.</td></tr>'}
                </tbody>
            </table>
        `;

        // 2. Unified System Users
        html += `
            <h3 style="margin-top:40px; border-bottom:2px solid #333; padding-bottom:5px;">Unified System Users</h3>
            <table>
                <thead>
                    <tr><th>Name</th><th>Role</th><th>Dept</th><th>Email/ID</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${data.users.map(u => `
                        <tr>
                            <td><strong>${u.fullName || u.username}</strong></td>
                            <td><span class="badge" style="background:#6c757d;">${u.role}</span></td>
                            <td>${u.department || 'N/A'}</td>
                            <td>${u.email}<br><small style="color:#666;">${u.studentId || ''}</small></td>
                            <td><button class="btn-edit" onclick="openEditModal('${u._id}')">Edit</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    
        // 3. Department Breakdown
        depts.forEach(dept => {
            const users = data.users.filter(u => u.department === dept);
            html += `
                <h3 style="color:#0d6efd; margin-top:50px; border-bottom:2px solid #0d6efd; padding-bottom:5px;">${dept} Department</h3>
                <table>
                    <thead><tr><th>Name</th><th>Role</th><th>Grades</th><th>Actions</th></tr></thead>
                    <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.fullName || u.username}</td>
                            <td><span class="badge" style="background:${u.role==='faculty'?'#6f42c1':'#0d6efd'}">${u.role}</span></td>
                            <td>${u.role === 'user' ? formatGrades(u.grades) : 'N/A'}</td>
                            <td><button class="btn-edit" onclick="openEditModal('${u._id}')">Edit</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        });

        // NEW: System Activity Logs
        html += `
            <h3 style="margin-top:40px; border-bottom:2px solid #333; padding-bottom:5px;">System Activity Logs</h3>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; background: #fff;">
                <table style="margin-top: 0; border: none;">
                    <thead style="position: sticky; top: 0; z-index: 1; outline: 1px solid #eee;">
                    <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>IP Address</th></tr>
                    </thead>
                    <tbody>
                        ${(data.logs && data.logs.length > 0) 
                            ? data.logs.map(l => `
                                <tr>
                                <td style="color:#666; font-size:13px;">${new Date(l.timestamp).toLocaleString()}</td>
                                <td><strong>${l.user_id ? l.user_id.username : 'System / Guest'}</strong></td>
                                <td><span class="badge" style="background:#6c757d;">${l.action}</span></td>
                                <td style="color:#374151;">${l.details || '—'}</td>
                                <td style="font-family: monospace; color:#888;">${l.ip_address || 'N/A'}</td>
                                </tr>`).join('') 
                            : '<tr><td colspan="4" style="text-align:center; color:#888;">No activity logs found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        } else if (role === 'faculty') {
    const user = data.user;
    html += `
        <div class="alert-info">
            <h4 style="margin-top:0;">Welcome, ${user.fullName || user.username}</h4>
            <p style="margin:5px 0 0 0;">${user.department} | Faculty ID: ${user.facultyId || 'N/A'}</p>
        </div>
        <h3 style="margin-top:24px;">Students in Your Department</h3>
        <table>
            <thead><tr><th>Name</th><th>Student ID</th><th>Grades</th><th>Award Grade</th></tr></thead>
            <tbody>
                ${data.peers.map(p => `
                    <tr>
                        <td><strong>${p.fullName || p.username}</strong></td>
                        <td>${p.studentId}</td>
                        <td>${formatGrades(p.grades)}</td>
                        <td>
                            <button class="btn-edit" onclick="openAwardGradeModal('${p._id}', '${p.fullName || p.username}')">
                                Award Grade
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

        
    } else {
        // --- STUDENT VIEW ---
        const user = data.user;
        html += `
            <div class="alert-info">
                <h4 style="margin-top:0;">Welcome, ${user.fullName || user.username}</h4>
                <p style="margin:5px 0 0 0;">${user.department} | ID: ${user.studentId}</p>
            </div>
            <div style="display:flex; gap:20px; margin-top:20px;">
                <div style="flex:1;">
                    <h3>My Grades</h3>
                    <table>
                        <thead><tr><th>Subject</th><th>Grade</th></tr></thead>
                        <tbody>
                            ${user.grades.length > 0 ? user.grades.map(g=>`<tr><td>${g.subject}</td><td style="color:#198754; font-weight:bold;">${g.grade}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;">No grades posted.</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div style="flex:1;">
                    <h3>Classmates</h3>
                    <table>
                        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
                        <tbody>
                            ${data.peers.map(p=>`<tr><td>${p.studentId}</td><td>${p.fullName || p.username}</td><td style="color:#0d6efd;">${p.email}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }
    
    panel.innerHTML = html;
}

// OPEN MODAL
window.openEditModal = function(userId) {
    const u = globalUsers.find(user => user._id === userId);
    if (!u) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    
    setVal('edit-id', u._id);
    setVal('edit-fullName', u.fullName);
    setVal('edit-username', u.username);
    setVal('edit-email', u.email);
    setVal('edit-role', u.role);
    setVal('edit-department', u.department);
    setVal('edit-studentId', u.studentId);

    toggleEditStudentId();

    // Clear old rows
    const gList = document.getElementById('grades-list-inputs');
    if (gList) gList.innerHTML = '';

    // Populate existing grades or leave empty
    if (u.role === 'user') {
        if (u.grades && u.grades.length > 0) {
            u.grades.forEach(g => addGradeRow(g.subject, g.grade));
        } else {
            gList.innerHTML = '<p id="no-grades-msg" style="font-size:13px; color:#888; margin: 0 0 10px 0;">No grades assigned. Click + Add Subject.</p>';
        }
    }
    
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'flex';
};

window.openAwardGradeModal = function(studentId, studentName) {
    const subject = prompt(`Subject for ${studentName}:`);
    if (!subject) return;
    const grade = prompt(`Grade for ${subject}:`);
    if (!grade) return;

    fetch(`${API_BASE}/protected/faculty/award-grade/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, grade })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        fetchDashboardData(); // Refresh
    })
    .catch(err => console.error(err));
};

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('edit-role')?.addEventListener('change', toggleEditStudentId);
    
    document.getElementById('close-modal').onclick = () => {
        document.getElementById('edit-modal').style.display = 'none';
    };
    
    document.getElementById('add-grade-btn')?.addEventListener('click', () => {
        const noGradesMsg = document.getElementById('no-grades-msg');
        if (noGradesMsg) noGradesMsg.remove(); // Remove the "No grades" text if it exists
        addGradeRow(); // Add a blank row
    });

    // Update subjects if Admin changes the student's department in the modal
    document.getElementById('edit-department')?.addEventListener('change', () => {
        const rows = document.querySelectorAll('.grade-row');
        if (rows.length > 0) {
            alert("Department changed. Please review the subjects, as they belong to the previous department.");
        }
    });

    document.getElementById('edit-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const roleVal = document.getElementById('edit-role').value;
        
        let grades = [];
        if (roleVal === 'user') {
            const gradeRows = document.querySelectorAll('.grade-row');
            grades = Array.from(gradeRows).map(row => ({
                subject: row.querySelector('.edit-subject').value,
                grade: row.querySelector('.edit-grade').value
            }));
        }

        const body = {
            fullName: document.getElementById('edit-fullName').value,
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            role: roleVal,
            department: document.getElementById('edit-department').value,
            studentId: document.getElementById('edit-studentId').value,
            grades
        };

        try {
            const res = await fetch(`${API_BASE}/protected/admin/edit-user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if(res.ok) {
                document.getElementById('edit-modal').style.display = 'none';
                fetchDashboardData();
            } else {
                alert("Failed to update user. Please check your inputs.");
            }
        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById('logout-btn').onclick = async () => {
        await fetch(`${API_BASE.replace('/protected', '')}/auth/logout`, { method: 'POST', credentials: 'include' });
        localStorage.clear();
        window.location.href = 'login.html';
    };

    fetchDashboardData();
});