/* Additional JavaScript for improving sidebar toggle */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar toggle initialization...');
    
    // Initialize sidebar toggle functionality
    initSidebarToggle();
    
    // Add click outside listener to close sidebar on mobile
    addClickOutsideListener();
    
    // Add ESC key listener to close sidebar
    addEscKeyListener();
});

function initSidebarToggle() {
    const sidebar = document.getElementById('chatSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleEmpty = document.getElementById('sidebarToggleEmpty');
    
    console.log('Sidebar elements:', {
        sidebar: sidebar ? 'Found' : 'Not found',
        sidebarToggle: sidebarToggle ? 'Found' : 'Not found',
        sidebarToggleEmpty: sidebarToggleEmpty ? 'Found' : 'Not found'
    });
    
    // Ensure both buttons trigger the sidebar toggle
    [sidebarToggle, sidebarToggleEmpty].forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                console.log('Sidebar toggle clicked:', button.id);
                e.preventDefault();
                e.stopPropagation();
                
                if (sidebar) {
                    sidebar.classList.toggle('show');
                    document.body.classList.toggle('sidebar-open');
                    
                    // Handle empty state
                    const chatEmpty = document.querySelector('.chat-empty');
                    if (chatEmpty) {
                        chatEmpty.classList.toggle('sidebar-visible');
                        console.log('Chat empty state toggled');
                    }
                }
            });
        }
    });
}

function addClickOutsideListener() {
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('chatSidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarToggleEmpty = document.getElementById('sidebarToggleEmpty');
        
        // If sidebar is shown and click is outside sidebar and not on toggle buttons
        if (
            sidebar && 
            sidebar.classList.contains('show') &&
            !sidebar.contains(e.target) && 
            e.target !== sidebarToggle &&
            e.target !== sidebarToggleEmpty &&
            !sidebarToggle?.contains(e.target) &&
            !sidebarToggleEmpty?.contains(e.target)
        ) {
            sidebar.classList.remove('show');
            document.body.classList.remove('sidebar-open');
            
            // Handle empty state
            const chatEmpty = document.querySelector('.chat-empty');
            if (chatEmpty) {
                chatEmpty.classList.remove('sidebar-visible');
            }
        }
    });
}

function addEscKeyListener() {
    // Close sidebar when ESC key is pressed
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('chatSidebar');
            if (sidebar && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                document.body.classList.remove('sidebar-open');
                
                // Handle empty state
                const chatEmpty = document.querySelector('.chat-empty');
                if (chatEmpty) {
                    chatEmpty.classList.remove('sidebar-visible');
                }
            }
        }
    });
}
