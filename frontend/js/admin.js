// Global variables
let currentBookingPage = 1;
let currentProfessionalPage = 1;
let currentUserPage = 1;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/auth', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            document.getElementById('adminName').innerHTML = `<i class="fas fa-user-cog me-1"></i>${data.admin.full_name}`;
            loadDashboard();
        } else {
            window.location.href = '/admin-login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin-login.html';
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/admin/logout', {
            credentials: 'include'
        });
        window.location.href = '/admin-login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin-login.html';
    }
}

// Load dashboard data
async function loadDashboard() {
    await loadStats();
    await loadBookings();
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const stats = await response.json();
            displayStats(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display statistics
function displayStats(stats) {
    const statsContainer = document.getElementById('stats-container');
    
    const statsCards = [
        {
            icon: 'fas fa-users',
            color: 'bg-primary bg-opacity-10 text-primary',
            number: stats.total_users || 0,
            label: 'Total Users'
        },
        {
            icon: 'fas fa-user-hard-hat',
            color: 'bg-success bg-opacity-10 text-success',
            number: stats.total_professionals || 0,
            label: 'Professionals'
        },
        {
            icon: 'fas fa-calendar-check',
            color: 'bg-info bg-opacity-10 text-info',
            number: stats.total_bookings || 0,
            label: 'Total Bookings'
        },
        {
            icon: 'fas fa-clock',
            color: 'bg-warning bg-opacity-10 text-warning',
            number: stats.pending_bookings || 0,
            label: 'Pending Bookings'
        },
        {
            icon: 'fas fa-file-signature',
            color: 'bg-danger bg-opacity-10 text-danger',
            number: stats.pending_verifications || 0,
            label: 'Pending Verifications'
        },
        {
            icon: 'fas fa-rupee-sign',
            color: 'bg-secondary bg-opacity-10 text-secondary',
            number: `Rs ${(stats.monthly_revenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
            label: 'Monthly Revenue'
        }
    ];
    
    let html = '';
    statsCards.forEach(card => {
        html += `
            <div class="col-md-4 col-lg-2 col-6 mb-3">
                <div class="stats-card text-center">
                    <div class="stats-icon ${card.color} mx-auto">
                        <i class="${card.icon}"></i>
                    </div>
                    <div class="stats-number">${card.number}</div>
                    <div class="stats-label">${card.label}</div>
                </div>
            </div>
        `;
    });
    
    statsContainer.innerHTML = html;
}

// Load bookings
async function loadBookings(page = 1) {
    currentBookingPage = page;
    
    const status = document.getElementById('booking-status-filter').value;
    const dateFrom = document.getElementById('booking-date-from').value;
    const dateTo = document.getElementById('booking-date-to').value;
    
    let url = `/api/admin/bookings?status=${status}&page=${page}&limit=10`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    
    try {
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayBookings(data);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showErrorMessage('bookings-table-body', 'Failed to load bookings');
    }
}

// Display bookings
function displayBookings(data) {
    const tbody = document.getElementById('bookings-table-body');
    const emptyState = document.getElementById('bookings-empty');
    
    if (!data.bookings || data.bookings.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('bookings-pagination').innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    data.bookings.forEach(booking => {
        // Use formatted date if available, otherwise format it
        let bookingDate, bookingTime;
        
        if (booking.formatted_date && booking.formatted_time) {
            bookingDate = booking.formatted_date;
            bookingTime = booking.formatted_time;
        } else {
            // Try to parse the date
            if (booking.booking_date) {
                try {
                    const dateObj = new Date(booking.booking_date);
                    if (!isNaN(dateObj.getTime())) {
                        bookingDate = dateObj.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    } else {
                        bookingDate = 'N/A';
                    }
                } catch (e) {
                    bookingDate = 'N/A';
                }
            } else {
                bookingDate = 'N/A';
            }
            
            // Format time
            if (booking.booking_time) {
                if (typeof booking.booking_time === 'string') {
                    bookingTime = booking.booking_time.substring(0, 5);
                } else {
                    bookingTime = '08:00';
                }
            } else {
                bookingTime = 'N/A';
            }
        }
        
        const statusClass = `status-${booking.status.toLowerCase()}`;
        const statusText = booking.status.replace('_', ' ').toUpperCase();
        
        html += `
            <tr>
                <td>#${booking.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas ${booking.service_icon || 'fa-wrench'} me-2"></i>
                        ${booking.service_name}
                    </div>
                </td>
                <td>
                    <div>${booking.customer_name || 'N/A'}</div>
                    <small class="text-muted">${booking.customer_phone || ''}</small>
                </td>
                <td>
                    <div>${bookingDate}</div>
                    <small class="text-muted">${bookingTime}</small>
                </td>
                <td>
                    ${booking.professional_name || 
                      `<span class="text-muted">Not assigned</span>`}
                </td>
                <td class="fw-bold">Rs ${parseFloat(booking.total_price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                <td><span class="${statusClass} status-badge">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewBooking(${booking.id})" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-edit" onclick="editBooking(${booking.id})" 
                                title="Edit Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${booking.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="assignProfessional(${booking.id})" 
                                title="Assign Professional">
                            <i class="fas fa-user-check"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Update pagination
    updatePagination('bookings', data.pagination);
}

// View booking details
async function viewBooking(bookingId) {
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch booking details');
        }
        
        const booking = await response.json();
        showBookingDetails(booking);
    } catch (error) {
        console.error('Error loading booking:', error);
        alert('Failed to load booking details');
    }
}

// Show booking details in modal
function showBookingDetails(booking) {
    // Create modal content
    const bookingDate = booking.booking_date ? new Date(booking.booking_date) : new Date();
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const content = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <h6>Booking ID</h6>
                <p class="mb-0">#${booking.id}</p>
            </div>
            <div class="col-md-6 mb-3">
                <h6>Status</h6>
                <select class="form-select" id="edit_booking_status">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="in_progress" ${booking.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Service</h6>
                <p class="mb-0"><strong>${booking.service_name}</strong></p>
                <p class="text-muted small">${booking.service_description || ''}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <h6>Date & Time</h6>
                <p class="mb-0">${formattedDate}</p>
                <p class="text-muted small">${booking.booking_time ? booking.booking_time.substring(0, 5) : 'Time not set'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <h6>Total Amount</h6>
                <h5 class="text-primary">Rs ${parseFloat(booking.total_price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</h5>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Customer</h6>
                <p class="mb-0">${booking.customer_name || 'N/A'}</p>
                <p class="text-muted small">${booking.customer_phone || ''}</p>
                <p class="text-muted small">${booking.customer_email || ''}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Professional</h6>
                <p class="mb-0">${booking.professional_name || 'Not assigned'}</p>
                <p class="text-muted small">${booking.professional_email || ''}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Address</h6>
                <p class="mb-0">${booking.address || 'Not provided'}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Special Instructions</h6>
                <p class="mb-0">${booking.special_instructions || 'None'}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Admin Notes</h6>
                <textarea class="form-control" id="edit_booking_notes" rows="3">${booking.admin_notes || ''}</textarea>
            </div>
        </div>
        <input type="hidden" id="current_booking_id" value="${booking.id}">
    `;
    
    document.getElementById('booking-details-content').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

// Edit booking (alias for viewBooking)
function editBooking(bookingId) {
    viewBooking(bookingId);
}

// Save booking changes
async function saveBookingChanges() {
    const bookingId = document.getElementById('current_booking_id').value;
    const status = document.getElementById('edit_booking_status').value;
    const notes = document.getElementById('edit_booking_notes').value;
    
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                status: status,
                admin_notes: notes 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update booking');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal')).hide();
        loadBookings(currentBookingPage);
        loadStats();
        
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to update booking');
    }
}

// Assign professional to booking
async function assignProfessional(bookingId) {
    try {
        // Get available professionals
        const response = await fetch('/api/professionals?limit=100', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch professionals');
        }
        
        const professionals = await response.json();
        
        if (professionals.length === 0) {
            alert('No professionals available');
            return;
        }
        
        // Create modal for assigning professional
        let options = '<option value="">Select a professional</option>';
        professionals.forEach(pro => {
            options += `<option value="${pro.id}">${pro.name} - ${pro.service_name} (Rating: ${pro.rating || 'N/A'})</option>`;
        });
        
        const assignHtml = `
            <div class="modal fade" id="assignProfessionalModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Assign Professional to Booking #${bookingId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="assign_professional_id" class="form-label">Select Professional</label>
                                <select class="form-select" id="assign_professional_id">
                                    ${options}
                                </select>
                            </div>
                            <input type="hidden" id="assign_booking_id" value="${bookingId}">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveProfessionalAssignment()">Assign</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', assignHtml);
        const modal = new bootstrap.Modal(document.getElementById('assignProfessionalModal'));
        modal.show();
        
        // Clean up modal after close
        document.getElementById('assignProfessionalModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error assigning professional:', error);
        alert('Failed to load professionals');
    }
}

// Save professional assignment
async function saveProfessionalAssignment() {
    const bookingId = document.getElementById('assign_booking_id').value;
    const professionalId = document.getElementById('assign_professional_id').value;
    
    if (!professionalId) {
        alert('Please select a professional');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ professional_id: professionalId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to assign professional');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('assignProfessionalModal')).hide();
        loadBookings(currentBookingPage);
        loadStats();
        
    } catch (error) {
        console.error('Error assigning professional:', error);
        alert('Failed to assign professional');
    }
}

// Load professionals
async function loadProfessionals(page = 1) {
    currentProfessionalPage = page;
    
    const verification = document.getElementById('professional-verification-filter').value;
    const search = document.getElementById('professional-search').value;
    
    let url = `/api/admin/professionals?page=${page}&limit=12`;
    if (verification !== 'all') {
        url += `&verified=${verification}`;
    }
    
    try {
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayProfessionals(data);
        }
    } catch (error) {
        console.error('Error loading professionals:', error);
        showErrorMessage('professionals-container', 'Failed to load professionals');
    }
}

// Display professionals
function displayProfessionals(data) {
    const container = document.getElementById('professionals-container');
    const emptyState = document.getElementById('professionals-empty');
    
    if (!data.professionals || data.professionals.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('professionals-pagination').innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    data.professionals.forEach(professional => {
        const verificationStatus = professional.verified_by_admin ? 'verified' : 'unverified';
        const statusClass = `status-${verificationStatus}`;
        const statusText = professional.verified_by_admin ? 'VERIFIED' : 'PENDING';
        const initials = professional.name ? professional.name.charAt(0).toUpperCase() : 'P';
        
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="admin-card card">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="flex-shrink-0">
                                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                                     style="width: 50px; height: 50px; font-size: 1.25rem;">
                                    ${initials}
                                </div>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <h6 class="mb-1">${professional.name}</h6>
                                <p class="text-muted small mb-1">${professional.service_name || 'Service'}</p>
                                <span class="${statusClass} status-badge">${statusText}</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <p class="small mb-1"><i class="fas fa-envelope me-2"></i>${professional.email}</p>
                            <p class="small mb-1"><i class="fas fa-phone me-2"></i>${professional.phone || 'Not provided'}</p>
                            <p class="small mb-0"><i class="fas fa-briefcase me-2"></i>${professional.experience_years || 0} years experience</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-light text-dark">
                                    <i class="fas fa-star text-warning me-1"></i>
                                    ${(professional.avg_rating || 0).toFixed(1)}
                                </span>
                                <span class="badge bg-light text-dark ms-2">
                                    <i class="fas fa-check-circle me-1"></i>
                                    ${professional.completed_jobs || 0} jobs
                                </span>
                            </div>
                            <div class="action-buttons">
                                ${!professional.verified_by_admin ? `
                                <button class="action-btn btn-approve" onclick="verifyProfessional(${professional.id})" 
                                        title="Verify Professional">
                                    <i class="fas fa-check"></i>
                                </button>
                                ` : ''}
                                <button class="action-btn btn-view" onclick="viewProfessional(${professional.id})" 
                                        title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Update pagination
    updatePagination('professionals', data.pagination);
}

// Verify professional
function verifyProfessional(professionalId) {
    document.getElementById('verify_professional_id').value = professionalId;
    document.getElementById('verification_action').value = 'approve';
    document.getElementById('verification_notes').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('verifyProfessionalModal'));
    modal.show();
}

// Submit verification
async function submitVerification() {
    const professionalId = document.getElementById('verify_professional_id').value;
    const action = document.getElementById('verification_action').value;
    const notes = document.getElementById('verification_notes').value;
    
    try {
        const response = await fetch(`/api/admin/professionals/${professionalId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ action, admin_notes: notes })
        });
        
        if (!response.ok) {
            throw new Error('Failed to verify professional');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('verifyProfessionalModal')).hide();
        loadProfessionals(currentProfessionalPage);
        loadStats();
        
    } catch (error) {
        console.error('Error verifying professional:', error);
        alert('Failed to verify professional');
    }
}

// Load services
async function loadServices() {
    try {
        const response = await fetch('/api/admin/services', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const services = await response.json();
            displayServices(services);
        }
    } catch (error) {
        console.error('Error loading services:', error);
        showErrorMessage('services-container', 'Failed to load services');
    }
}

// Display services
function displayServices(services) {
    const container = document.getElementById('services-container');
    const emptyState = document.getElementById('services-empty');
    
    if (!services || services.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    services.forEach(service => {
        const icon = service.icon || 'fa-wrench';
        const activeStatus = service.is_active ? 'Active' : 'Inactive';
        const statusClass = service.is_active ? 'bg-success' : 'bg-secondary';
        
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="admin-card card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <div class="rounded-circle ${service.is_active ? 'bg-primary' : 'bg-secondary'} text-white d-flex align-items-center justify-content-center" 
                                     style="width: 40px; height: 40px;">
                                    <i class="fas ${icon}"></i>
                                </div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" ${service.is_active ? 'checked' : ''}
                                       onchange="toggleServiceStatus(${service.id})">
                            </div>
                        </div>
                        <h6 class="mb-2">${service.name}</h6>
                        <p class="text-muted small mb-3">${service.description || 'No description'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-primary">Rs ${parseFloat(service.price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                                <span class="badge bg-light text-dark ms-2">
                                    <i class="fas fa-clock me-1"></i>${service.duration_minutes || 120}m
                                </span>
                                <span class="badge ${statusClass} ms-2">${activeStatus}</span>
                            </div>
                            <div class="action-buttons">
                                <button class="action-btn btn-edit" onclick="editService(${service.id})" 
                                        title="Edit Service">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Toggle service status
async function toggleServiceStatus(serviceId) {
    if (!confirm('Are you sure you want to change the service status?')) {
        // Reload to reset the switch
        loadServices();
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/services/${serviceId}/toggle`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update service status');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Reload services
        loadServices();
        
    } catch (error) {
        console.error('Error toggling service:', error);
        alert('Failed to update service status');
        // Reload to reset the switch
        loadServices();
    }
}

// Show service modal for adding/editing
function showServiceModal(serviceId = null) {
    document.getElementById('serviceForm').reset();
    document.getElementById('service_id').value = serviceId || '';
    document.getElementById('serviceModalTitle').textContent = serviceId ? 'Edit Service' : 'Add New Service';
    
    // If editing, load service data
    if (serviceId) {
        // Load service data here (you'll need to implement this)
        // For now, we'll just show the modal
    }
    
    const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
    modal.show();
}

// Save service
async function saveService() {
    const serviceData = {
        name: document.getElementById('service_name').value,
        description: document.getElementById('service_description').value,
        price: parseFloat(document.getElementById('service_price').value),
        duration_minutes: parseInt(document.getElementById('service_duration').value) || 120,
        icon: document.getElementById('service_icon').value || 'fa-wrench',
        category: document.getElementById('service_category').value || 'general',
        is_active: document.getElementById('service_active').checked
    };
    
    // Validate
    if (!serviceData.name || !serviceData.price) {
        alert('Name and price are required');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(serviceData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save service');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
        loadServices();
        
    } catch (error) {
        console.error('Error saving service:', error);
        alert('Failed to save service');
    }
}

// Edit service (placeholder - you'll need to implement loading service data)
function editService(serviceId) {
    // For now, just show the modal with the service ID
    showServiceModal(serviceId);
    
    // TODO: Load service data and populate form
    // You'll need to create an API endpoint to get a single service by ID
}

// Load users
async function loadUsers(page = 1) {
    currentUserPage = page;
    
    const status = document.getElementById('user-status-filter').value;
    const search = document.getElementById('user-search').value;
    
    let url = `/api/admin/users?page=${page}&limit=10`;
    if (status !== 'all') {
        url += `&active=${status === 'active' ? 'true' : 'false'}`;
    }
    
    try {
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUsers(data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showErrorMessage('users-table-body', 'Failed to load users');
    }
}

// Display users
function displayUsers(data) {
    const tbody = document.getElementById('users-table-body');
    const emptyState = document.getElementById('users-empty');
    
    if (!data.users || data.users.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('users-pagination').innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    data.users.forEach(user => {
        const joinDate = user.created_at ? new Date(user.created_at) : new Date();
        const formattedDate = joinDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        html += `
            <tr>
                <td>#${user.id}</td>
                <td>${user.name || 'No name'}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <span class="badge bg-primary">${user.total_bookings || 0}</span>
                    <span class="badge bg-success ms-1">${user.completed_bookings || 0}</span>
                </td>
                <td>
                    ${user.is_active ? 
                        '<span class="badge bg-success">Active</span>' : 
                        '<span class="badge bg-danger">Inactive</span>'}
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewUser(${user.id})" 
                                title="View User">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn ${user.is_active ? 'btn-delete' : 'btn-approve'}" 
                                onclick="toggleUserStatus(${user.id})" 
                                title="${user.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${user.is_active ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Update pagination
    updatePagination('users', data.pagination);
}

// Toggle user status
async function toggleUserStatus(userId) {
    const action = confirm('Are you sure you want to change this user\'s status?');
    if (!action) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/toggle`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update user status');
        }
        
        const result = await response.json();
        alert(result.message);
        
        // Refresh users list
        loadUsers(currentUserPage);
        
    } catch (error) {
        console.error('Error toggling user:', error);
        alert('Failed to update user status');
    }
}

// Update pagination
function updatePagination(type, pagination) {
    const container = document.getElementById(`${type}-pagination`);
    
    if (!pagination || pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHtml = `
        <ul class="pagination">
            <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="${type === 'bookings' ? 'loadBookings' : type === 'professionals' ? 'loadProfessionals' : 'loadUsers'}(${pagination.page - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
    `;
    
    // Show first page, pages around current, and last page
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.pages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Show first page if not already shown
    if (startPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="${type === 'bookings' ? 'loadBookings' : type === 'professionals' ? 'loadProfessionals' : 'loadUsers'}(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Show page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === pagination.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="${type === 'bookings' ? 'loadBookings' : type === 'professionals' ? 'loadProfessionals' : 'loadUsers'}(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Show last page if not already shown
    if (endPage < pagination.pages) {
        if (endPage < pagination.pages - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="${type === 'bookings' ? 'loadBookings' : type === 'professionals' ? 'loadProfessionals' : 'loadUsers'}(${pagination.pages}); return false;">${pagination.pages}</a>
            </li>
        `;
    }
    
    paginationHtml += `
        <li class="page-item ${pagination.page === pagination.pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${type === 'bookings' ? 'loadBookings' : type === 'professionals' ? 'loadProfessionals' : 'loadUsers'}(${pagination.page + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    </ul>`;
    
    container.innerHTML = paginationHtml;
}

// Helper function to show error messages
function showErrorMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
                </td>
            </tr>
        `;
    }
}