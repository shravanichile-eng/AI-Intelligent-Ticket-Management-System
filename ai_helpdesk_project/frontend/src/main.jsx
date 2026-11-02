import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  LayoutDashboard,
  Ticket,
  Folder,
  Building2,
  MessageSquare,
  Paperclip,
  Users,
  Mail,
  History,
  UserCircle,
  LogOut,
  Moon,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Send,
  Lock,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Database,
  BookOpen,
  Bell
} from 'lucide-react';

import { get, post, put, patch, del, uploadFile } from './services/api';
import './styles/app.css';


/* =========================================================
   HELPERS
========================================================= */

const statusClass = (s) =>
  ({
    Open: 'b-open',
    'In Progress': 'b-progress',
    Pending: 'b-pending',
    Resolved: 'b-resolved',
    Closed: 'b-closed'
  }[s] || 'b-open');


const priClass = (s) =>
  ({
    Low: 'b-low',
    Medium: 'b-medium',
    High: 'b-high',
    Urgent: 'b-urgent'
  }[s] || 'b-medium');


/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    department: 'IT Support'
  });

  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const d = await post('/auth/login', {
          username: form.username,
          password: form.password
        });

        localStorage.setItem('token', d.access_token);
        localStorage.setItem('user', JSON.stringify(d.user));

        onLogin(d.user);
      } else {
        await post('/auth/register', {
          ...form
        });

        setMode('login');
        setError('Registration successful. Please login.');
      }
    } catch (x) {
      setError(x.message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="avatar">
          HD
        </div>

        <h2>System Login</h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={submit}>

          {mode === 'register' && (
            <>
              <div className="field">
                <label>Full Name</label>

                <input
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value
                    })
                  }
                />
              </div>

              <div className="field">
                <label>Email</label>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="field">
            <label>Username</label>

            <input
              required
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value
                })
              }
            />
          </div>

          <div className="field">
            <label>Password</label>

            <input
              required
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
          >
            {mode === 'login' ? 'Login' : 'Register'}
          </button>

        </form>

        <div className="divider">
          {mode === 'login'
            ? 'New User?'
            : 'Already registered?'}
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setMode(
              mode === 'login'
                ? 'register'
                : 'login'
            );

            setError('');
          }}
        >
          {mode === 'login'
            ? 'Register Now'
            : 'Login'}
        </button>

      </div>
    </div>
  );
}



function NotificationBell({ user, setPage }) {

  // Notifications are only available for normal users
  if (user?.role !== 'user') {
    return null;
  }

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  async function loadNotifications() {
    try {
      const data = await get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  useEffect(() => {

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);

  }, [user.id]);

  const unread = notifications.filter(
    (n) => !n.is_read
  ).length;

  async function openNotification(notification) {

    try {

      // Mark notification as read
      if (!notification.is_read) {
        await patch(
          `/notifications/${notification.id}/read`,
          {}
        );
      }

      // Refresh notifications
      await loadNotifications();

      setOpen(false);

      // Open user's ticket
      if (notification.ticket_id) {

        localStorage.setItem(
          'open_ticket_id',
          String(notification.ticket_id)
        );

        setPage('tickets');
      }

    } catch (error) {
      console.error(
        'Notification open error:',
        error
      );
    }
  }

  return (
    <div
  className="notification-wrapper"
  onMouseEnter={() => setOpen(true)}
  onMouseLeave={() => setOpen(false)}
>

      <button
        className="notification-button"
        onClick={() => setOpen(!open)}
        title="Notifications"
      >

        <Bell size={19} />

        {unread > 0 && (
          <span className="notification-count">
            {unread > 9 ? '9+' : unread}
          </span>
        )}

      </button>


      {open && (

        <div className="notification-panel">

          <div className="notification-header">

            <strong>
              Notifications
            </strong>

          </div>


          {notifications.length === 0 ? (

            <div className="notification-empty">

              <Bell size={30} />

              <p>
                No new notifications
              </p>

              <small>
                You will be notified when your
                tickets are updated.
              </small>

            </div>

          ) : (

            <div className="notification-list">

              {notifications.map(
                (notification) => (

                  <button
                    key={notification.id}
                    className={
                      notification.is_read
                        ? 'notification-item read'
                        : 'notification-item'
                    }
                    onClick={() =>
                      openNotification(
                        notification
                      )
                    }
                  >

                    <div
                      className={
                        notification.is_read
                          ? 'notification-dot info'
                          : 'notification-dot success'
                      }
                    />


                    <div className="notification-content">

                      <strong>
                        {notification.title}
                      </strong>

                      <span>
                        {notification.message}
                      </span>

                      {notification.solution && (
                        <small>
                          {notification.solution}
                        </small>
                      )}

                      <small>
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : 'Just now'}
                      </small>

                    </div>

                  </button>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>
  );
}
/* =========================================================
   LAYOUT
========================================================= */

function Layout({
  user,
  page,
  setPage,
  children
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [dark, setDark] =
    useState(
      localStorage.getItem('dark') === '1'
    );

  useEffect(() => {
    localStorage.setItem(
      'dark',
      dark ? '1' : '0'
    );
  }, [dark]);


  const menus =
    user.role === 'admin'
      ? [
          [
            'dashboard',
            'Dashboard',
            LayoutDashboard
          ],
          [
            'tickets',
            'All Tickets',
            Ticket
          ],
          [
            'categories',
            'Categories',
            Folder
          ],
          
          [
            'comments',
            'Comments',
            MessageSquare
          ],
          [
            'attachments',
            'Attachments',
            Paperclip
          ],
          
          [
            'users',
            'Users Management',
            Users
          ],
          [
            'email',
            'Email Settings',
            Mail
          ],
          [
            'knowledge',
            'AI / Knowledge Base',
            BookOpen
          ],
          [
            'logs',
            'Audit Logs',
            History
          ],
          [
            'account',
            'My Account',
            UserCircle
          ]
        ]
      : user.role === 'agent'
        ? [
            [
              'dashboard',
              'Dashboard',
              LayoutDashboard
            ],
            [
              'tickets',
              'My Tickets',
              Ticket
            ],
            
            [
              'knowledge',
              'AI Assistant',
              BookOpen
            ],
            [
              'logs',
              'My Logs',
              History
            ],
            [
              'account',
              'My Account',
              UserCircle
            ]
          ]
        : [
            [
              'dashboard',
              'Dashboard',
              LayoutDashboard
            ],
            [
              'tickets',
              'My Tickets',
              Ticket
            ],
            
            [
              'knowledge',
              'AI Assistant',
              BookOpen
            ],
            [
              'logs',
              'My Logs',
              History
            ],
            [
              'account',
              'My Account',
              UserCircle
            ]
          ];


  return (
    <div className={dark ? 'app dark' : 'app'}>

      <aside
        className={
          collapsed
            ? 'sidebar collapsed'
            : 'sidebar'
        }
      >

        <div className="brand">

          <div className="brand-icon">
            HD
          </div>

          <span>
            Dashboard
          </span>

        </div>


        <div className="profile">

          <div className="avatar">
  {(user?.username || user?.full_name || 'US').slice(0, 2).toUpperCase()}
</div>
          <strong>{user?.username || user?.full_name || 'User'}</strong>

          <div className="role">
          {user?.role || 'User'}          
          </div>

        </div>


        <div className="nav-title">
          NAVIGATION
        </div>


        <nav className="nav">

          {menus.map(
            ([id, label, Icon]) => (
              <button
                key={id}
                className={
                  page === id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(id)
                }
              >
                <Icon size={16} />

                <span>
                  {label}
                </span>
              </button>
            )
          )}

        </nav>


        <div className="side-bottom">

          <button
            className="dark-btn"
            onClick={() =>
              setDark(!dark)
            }
          >
            <Moon size={15} />

            <span>
              {dark
                ? 'Light Mode'
                : 'Dark Mode'}
            </span>
          </button>


          <button
            className="logout"
            onClick={() => {
              localStorage.clear();
              location.reload();
            }}
          >
            <LogOut size={15} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>


      <main className="main">

        <header className="topbar">

  <h1>
    <LayoutDashboard size={17}/>
    {titleFor(page)}
  </h1>

  <div className="topbar-right">

    <NotificationBell
      user={user}
      setPage={setPage}
    />

    <div className="welcome">
      Welcome, {user.username}
    </div>

  </div>

</header>

        <div className="content">
          {children}
        </div>

      </main>

    </div>
  );
}


/* =========================================================
   PAGE TITLES
========================================================= */

function titleFor(p) {
  return (
    {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      categories:
        'Categories Management',
      comments: 'Comments',
      attachments: 'Attachments',
      users: 'Users',
      email: 'Email Settings',
      knowledge:
        'AI / Knowledge Base',
      logs: 'Audit Logs',
      account: 'My Account'
    }[p] || 'Dashboard'
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function Stat({
  icon: Icon,
  num,
  label,
  cls = ''
}) {
  return (
    <div className={'stat ' + cls}>

      <div className="icon">
        <Icon size={19} />
      </div>

      <strong>
        {num}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  user,
  setPage
}) {
  const [d, setD] =
    useState({});

  useEffect(() => {
    get('/dashboard')
      .then(setD)
      .catch(() => {});
  }, []);


  return (
    <>

      <div className="toolbar">
        
      </div>


      {user.role === 'admin' && (
        <div className="cards">

          <Stat
            icon={Users}
            num={d.total_users ?? 0}
            label="TOTAL USERS"
          />

          <Stat
            icon={ShieldCheck}
            num={d.active_users ?? 0}
            label="ACTIVE USERS"
            cls="green"
          />

          <Stat
            icon={ShieldCheck}
            num={d.admin_users ?? 0}
            label="ADMIN USERS"
            cls="red"
          />

          <Stat
            icon={Users}
            num={d.agent_users ?? 0}
            label="AGENT USERS"
          />

        </div>
      )}


      <div className="toolbar">
        <h2>
          Ticket Statistics
        </h2>
      </div>


      <div className="cards five">

        <Stat
          icon={Ticket}
          num={d.total_tickets ?? 0}
          label="TOTAL TICKETS"
        />

        <Stat
          icon={Folder}
          num={d.open ?? 0}
          label="OPEN TICKETS"
        />

        <Stat
          icon={History}
          num={d.in_progress ?? 0}
          label="IN PROGRESS"
          cls="yellow"
        />

        <Stat
          icon={ShieldCheck}
          num={d.resolved ?? 0}
          label="RESOLVED"
          cls="green"
        />

        <Stat
          icon={Users}
          num={d.unassigned ?? 0}
          label="UNASSIGNED TICKETS"
          cls="purple"
        />

      </div>


      <div className="panel">

        <div className="panel-title">
          Quick Actions
        </div>

        <div
          style={{
            padding: 14,
            display: 'flex',
            gap: 8
          }}
        >

          <button
            className="btn btn-success"
            onClick={() =>
              setPage('tickets')
            }
          >
            <Ticket size={15} />

            View Tickets
          </button>


          <button
            className="btn btn-primary"
            onClick={() =>
              setPage('knowledge')
            }
          >
            <BookOpen size={15} />

            AI Knowledge Assistant
          </button>

        </div>

      </div>

    </>
  );
}


/* =========================================================
   STATUS BAR
========================================================= */

function StatusBar({
  tickets,
  filter,
  setFilter
}) {
  const count = (s) =>
    s === 'All'
      ? tickets.length
      : tickets.filter(
          (t) => t.status === s
        ).length;


  return (
    <div className="statusbar">

      {[
        ['All', 'all'],
        ['Open', 'open'],
        ['In Progress', 'progress'],
        ['Pending', 'pending'],
        ['Resolved', 'resolved'],
        ['Closed', 'closed']
      ].map(([s, c]) => (

        <button
          key={s}
          className={
            'statuspill ' + c
          }
          onClick={() =>
            setFilter(s)
          }
        >

          {s}

          <small>
            {count(s)}
          </small>

        </button>

      ))}

    </div>
  );
}


/* =========================================================
   TICKETS
========================================================= */

/* =========================================================
   USER TICKET DETAILS
========================================================= */

function UserTicketDetails({
  initialTicket,
  onClose
}) {
  if (!initialTicket) return null;

  const [latestTicket, setLatestTicket] =
    useState(initialTicket);

  const [ticketLoading, setTicketLoading] =
    useState(true);

  useEffect(() => {
    get(`/tickets/${initialTicket.id}`)
      .then((data) => {
        setLatestTicket(data);
      })
      .catch(() => {
        setLatestTicket(initialTicket);
      })
      .finally(() => {
        setTicketLoading(false);
      });
  }, [initialTicket.id]);

  const ticket = latestTicket;
const [comments, setComments] = useState([]);
const [commentsLoading, setCommentsLoading] = useState(true);

useEffect(() => {
  get(`/tickets/${ticket.id}/comments`)
    .then(setComments)
    .catch(() => setComments([]))
    .finally(() => setCommentsLoading(false));
}, [ticket.id]);

  const getStatusMessage = () => {
    if (ticket.status === 'Resolved' && ticket.resolution) {
      return null;
    }

    if (ticket.status === 'Open') {
      return 'Our support team has received your ticket and is reviewing it.';
    }

    if (ticket.status === 'In Progress') {
      return 'Our support team is currently working on this ticket.';
    }

    if (ticket.status === 'Pending') {
      return 'This ticket is currently pending further action.';
    }

    if (ticket.status === 'Closed') {
      return 'This ticket is closed. No resolution details are available.';
    }

    return 'Solution not available yet. Our support team is currently working on this ticket.';
  };

  return (
    <div className="modal-backdrop">

      <div
        className="modal"
        style={{
          maxWidth: 850,
          width: '95%'
        }}
      >

        <div className="modal-head">

          <span>
            <Ticket size={16} />

            Ticket Details
          </span>

          <button
            className="icon-btn"
            style={{
              color: '#fff'
            }}
            onClick={onClose}
          >
            <X />
          </button>

        </div>


        <div className="modal-body">

          {/* Ticket Header */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              gap: 10,
              flexWrap: 'wrap'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: 13,
                  color: '#777',
                  marginBottom: 4
                }}
              >
                Ticket ID
              </div>

              <strong
                style={{
                  fontSize: 18
                }}
              >
                {ticket.ticket_code}
              </strong>

            </div>


            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}
            >

              <span
                className={
                  'badge ' +
                  priClass(ticket.priority)
                }
              >
                {ticket.priority}
              </span>

              <span
                className={
                  'badge ' +
                  statusClass(ticket.status)
                }
              >
                {ticket.status}
              </span>

            </div>

          </div>


          {/* Ticket Information */}

          <div
            className="panel"
            style={{
              marginBottom: 15
            }}
          >

            <div className="panel-title">
              Ticket Information
            </div>

            <div
              style={{
                padding: 15,
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 15
              }}
            >

              <div>
                <strong>Title</strong>
                <div className="muted">
                  {ticket.title || '-'}
                </div>
              </div>


              <div>
                <strong>Category</strong>
                <div className="muted">
                  {ticket.category_name || '-'}
                </div>
              </div>


              <div>
                <strong>Department</strong>
                <div className="muted">
                  {ticket.department || '-'}
                </div>
              </div>


              <div>
                <strong>Assigned Agent</strong>
                <div className="muted">
                  {ticket.assignee_name || 'Not assigned yet'}
                </div>
              </div>


              <div>
                <strong>Created</strong>
                <div className="muted">
                  {ticket.created_at
                    ? new Date(
                        ticket.created_at
                      ).toLocaleString()
                    : '-'}
                </div>
              </div>


              <div>
                <strong>Updated</strong>
                <div className="muted">
                  {ticket.updated_at
                    ? new Date(
                        ticket.updated_at
                      ).toLocaleString()
                    : '-'}
                </div>
              </div>


              <div>
                <strong>Due Date</strong>
                <div className="muted">
                  {ticket.due_date
                    ? new Date(
                        ticket.due_date
                      ).toLocaleString()
                    : 'Not set'}
                </div>
              </div>

            </div>

          </div>


          {/* Description */}

          <div
            className="panel"
            style={{
              marginBottom: 15
            }}
          >

            <div className="panel-title">
              Description
            </div>

            <div
              style={{
                padding: 15,
                whiteSpace: 'pre-wrap'
              }}
            >
              {ticket.description || '-'}
            </div>

          </div>


          {/* Public Comments */}

<div
  className="panel"
  style={{
    marginBottom: 15
  }}
>

  <div className="panel-title">
    Public Comments
  </div>

  <div
    style={{
      padding: 15
    }}
  >

    {commentsLoading ? (

      <div className="muted">
        Loading comments...
      </div>

    ) : comments.length === 0 ? (

      <div className="muted">
        No public comments yet.
      </div>

    ) : (

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >

        {comments.map((comment) => (

          <div
            key={comment.id}
            style={{
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 6
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 6
              }}
            >

              <strong>
                {comment.author_name || 'Support Team'}
              </strong>

              <small className="muted">
                {comment.created_at
                  ? new Date(
                      comment.created_at
                    ).toLocaleString()
                  : ''}
              </small>

            </div>

            <div
              style={{
                whiteSpace: 'pre-wrap'
              }}
            >
              {comment.body}
            </div>

            {comment.attachment_url && (
              <div
                style={{
                  marginTop: 8
                }}
              >

                <a
                  href={comment.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Attachment
                </a>

              </div>
            )}

          </div>

        ))}

      </div>

    )}

  </div>

</div>


          {/* Resolution */}

          <div
            className="panel"
            style={{
              marginBottom: 15
            }}
          >

            <div className="panel-title">
              Resolution / Solution
            </div>

            <div
              style={{
                padding: 15,
                whiteSpace: 'pre-wrap'
              }}
            >

              {ticket.status === 'Resolved' &&
              ticket.resolution ? (

                <div>
                  {ticket.resolution}
                </div>

              ) : (

                <div className="muted">
                  {getStatusMessage()}
                </div>

              )}

            </div>

          </div>

      {/* Solution Attachment */}
{ticket.resolution_attachment_url && (
  <div
    className="panel"
    style={{ marginBottom: 15 }}
  >
    <div className="panel-title">
      Solution Attachment
    </div>

    <div style={{ padding: 15 }}>
      <a
        href={
          'http://localhost:8000' +
          ticket.resolution_attachment_url
        }
        target="_blank"
        rel="noreferrer"
      >
        📎 View Solution Attachment
      </a>
    </div>
  </div>
)}
          {/* Attachments */}

          {ticket.attachment_url && (

            <div
              className="panel"
              style={{
                marginBottom: 15
              }}
            >

              <div className="panel-title">
                Attachment
              </div>

              <div
                style={{
                  padding: 15
                }}
              >

                <a
                  href={
  'http://localhost:8000' +
  ticket.attachment_url
}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Attachment
                </a>

              </div>

            </div>

          )}

        </div>


        <div
          style={{
            padding: 15,
            borderTop: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >

          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

function Tickets({ user }) {

  const [tickets, setTickets] =
    useState([]);

  const [cats, setCats] =
    useState([]);

  const [agents, setAgents] =
    useState([]);

  const [filter, setFilter] =
    useState('All');

  const [search, setSearch] =
    useState('');

  const [priority, setPriority] =
    useState('');

  const [category, setCategory] =
    useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const [modal, setModal] =
    useState(null);

  const [selectedTicket, setSelectedTicket] =
  useState(null);


  const load = () => {

  Promise.all([
    get('/tickets'),
    get('/categories'),
    get('/agents')
  ])
    .then(
      ([a, b, c]) => {

        setTickets(a);
        setCats(b);
        setAgents(c);

        // Check if a notification requested
        // a specific ticket to be opened
        const openTicketId =
          localStorage.getItem('open_ticket_id');

        if (openTicketId) {

          const ticket = a.find(
            (t) =>
              String(t.id) ===
              String(openTicketId)
          );

          if (ticket) {

            setModal({
              type: 'edit',
              ticket: ticket
            });

            // Remove it so it doesn't
            // automatically open again
            localStorage.removeItem(
              'open_ticket_id'
            );
          }
        }

      }
    )
    .catch(() => {});

};

  useEffect(() => {
    load();
  }, []);


  const shown = tickets.filter(
    (t) =>
      (
        filter === 'All' ||
        t.status === filter
      ) &&
      (
        !search ||
        `${t.ticket_code} ${t.title}`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ) &&
      (
        !priority ||
        t.priority === priority
      ) &&
      (
        !category ||
        String(t.category_id) ===
          String(category)
      )
  );

  const totalPages = Math.ceil(shown.length / ticketsPerPage);

  const paginatedTickets = shown.slice(
  (currentPage - 1) * ticketsPerPage,
  currentPage * ticketsPerPage
);


  return (
    <>

      <div className="toolbar">

        <h2>
          Tickets
        </h2>

        <button
          className="btn btn-success"
          onClick={() =>
            setModal({
              type: 'create'
            })
          }
        >
          <Plus size={15} />

          Create Ticket
        </button>

      </div>


      <StatusBar
        tickets={tickets}
        filter={filter}
        setFilter={setFilter}
      />


      <div className="panel">

        <div className="panel-title">

          Additional Filters

          <button
            className="btn btn-secondary"
            style={{
              float: 'right',
              padding: '5px 8px'
            }}
            onClick={() => {
              setSearch('');
              setPriority('');
              setCategory('');
              setFilter('All');
            }}
          >
            Clear
          </button>

        </div>


        <div className="filters">

          <div className="filter-grid">

            <div className="field">

              <label>
                SEARCH
              </label>

              <input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="field">

              <label>
                PRIORITY
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Priorities
                </option>

                {[
                  'Low',
                  'Medium',
                  'High',
                  'Urgent'
                ].map((x) => (
                  <option
                    key={x}
                    value={x}
                  >
                    {x}
                  </option>
                ))}

              </select>

            </div>


            <div className="field">

              <label>
                CATEGORY
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Categories
                </option>

                {cats.map((c) => (
                  <option
                    value={c.id}
                    key={c.id}
                  >
                    {c.name}
                  </option>
                ))}

              </select>

            </div>


            <div className="field">

              <label>
                ASSIGNED TO
              </label>

              <select>

                <option>
                  All Assignments
                </option>

                {agents.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                  >
                    {a.full_name}
                  </option>
                ))}

              </select>

            </div>

          </div>

        </div>


        


        <div className="table-wrap">

          <table className="table">

            <thead>

              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {paginatedTickets.map((t) => (

                <tr key={t.id}>

                  <td>
                    {t.ticket_code}
                  </td>

                  <td>
                    {t.title}
                  </td>

                  <td
                    className="category"
                    style={{
                      color: '#0b6cab'
                    }}
                  >
                    {t.category_name}
                  </td>

                  <td>

                    <span
                      className={
                        'badge ' +
                        priClass(
                          t.priority
                        )
                      }
                    >
                      {t.priority.toUpperCase()}
                    </span>

                  </td>

                  <td>

                    <span
                      className={
                        'badge ' +
                        statusClass(
                          t.status
                        )
                      }
                    >
                      {t.status.toUpperCase()}
                    </span>

                  </td>

                  <td>
                    {t.assignee_name}
                  </td>

                  <td>
                    {new Date(
                      t.created_at
                    ).toLocaleString()}
                  </td>

                  <td className="actions">

  {user.role === 'user' && (
  <button
    className="btn btn-secondary"
    onClick={() => setSelectedTicket(t)}
    title="View Ticket Details"
  >
    View Details
  </button>
)}

  {(user.role === 'admin' ||
  user.role === 'agent') && (

  <button
    className="icon-btn edit"
    title="Edit Ticket"
    onClick={() =>
      setModal({
        type: 'edit',
        ticket: t
      })
    }
  >
    <Edit size={17} />
  </button>

)}

{user.role === 'admin' && (
  <button
    className="icon-btn trash"
    title="Delete"
  >
    <Trash2 size={17} />
  </button>
)}
</td>
                </tr>

              ))}

            </tbody>

          </table>

        </div>


        <div className="pagination">

          <span>
            Showing 1 to {shown.length} of{' '}
            {shown.length} entries
          </span>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <button
    className="btn btn-secondary"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    Previous
  </button>

  <span>
    {currentPage} / {totalPages || 1}
  </span>

  <button
    className="btn btn-secondary"
    disabled={currentPage === totalPages || totalPages === 0}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next
  </button>
</div>

        </div>

      </div>


      {modal && (
        <TicketModal
          modal={modal}
          cats={cats}
          agents={agents}
          user={user}
          onClose={() =>
            setModal(null)
          }
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {selectedTicket && (
  <UserTicketDetails
      initialTicket={selectedTicket}
        onClose={() =>
      setSelectedTicket(null)
    }
  />
)}

    </>
  );
}


/* =========================================================
   TICKET MODAL
========================================================= */

function TicketModal({
  modal,
  cats,
  agents,
  user,
  onClose,
  onSaved
}) {

  const t = modal.ticket;


  const [form, setForm] = useState({
  title: t?.title || '',
  description: t?.description || '',
  category_id: t?.category_id || '',
  priority: t?.priority || 'Medium',
  assigned_to: t?.assigned_to || '',
  status: t?.status || 'Open',
  resolution: t?.resolution || '',
  due_date: t?.due_date
    ? new Date(t.due_date).toISOString().slice(0, 16)
    : ''
});

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [improvingTitle, setImprovingTitle] =
  useState(false);

  const [improvingDescription, setImprovingDescription] =
  useState(false);

  const [classifying, setClassifying] =
  useState(false);

  const [msg, setMsg] =
  useState('');
  const [resolutionAttachmentFile, setResolutionAttachmentFile] = useState(null);

  const [emailMessage, setEmailMessage] = useState('');
  const [emailAiLoading, setEmailAiLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [emailAttachmentUrl, setEmailAttachmentUrl] = useState('');

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentUrl, setCommentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [internalNote, setInternalNote] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  async function loadComments() {
  if (!t?.id || modal.type !== 'edit') return;

  try {
    const data = await get(`/tickets/${t.id}/comments`);
    setComments(data);
  } catch (e) {
    console.error('Comment loading error:', e);
  }
}

  useEffect(() => {
  loadComments();
}, [t?.id, modal.type]);

async function addComment() {
  if (!commentText.trim()) {
    setMsg('Please enter a comment.');
    return;
  }

  setCommentLoading(true);
  setMsg('');

  try {
    await post(`/tickets/${t.id}/comments`, {
  body: commentText.trim(),
  internal: internalNote,
  attachment_url: commentText.includes('/uploads/')
    ? commentText.match(/\/uploads\/[^\s]+/)?.[0] || ''
    : ''
});

    setCommentText('');
    setInternalNote(false);

    await loadComments();
  } catch (e) {
    setMsg(e.message);
  } finally {
    setCommentLoading(false);
  }
}


  async function improve(kind) {

  if (kind === 'title') {
    setImprovingTitle(true);
  } else {
    setImprovingDescription(true);
  }

  try {

      const d =
        await post(
          '/ai/' +
            (
              kind === 'title'
                ? 'improve-title'
                : 'improve-description'
            ),
          {
            text: form[kind]
          }
        );

      setForm({
        ...form,
        [kind]: d.result
      });

    } catch (e) {

      setMsg(e.message);

    } finally {

  if (kind === 'title') {
    setImprovingTitle(false);
  } else {
    setImprovingDescription(false);
  }

}
  }


  async function save() {

    if (form.status === 'Resolved' && !form.resolution.trim()) {
  setMsg('Please enter a resolution before marking the ticket as Resolved.');
  return;
}
  if (
  form.status === 'Resolved' &&
  t?.status !== 'Resolved'
) {
  const confirmed = window.confirm(
    'Are you sure you want to mark this ticket as Resolved?'
  );

  if (!confirmed) {
    return;
  }
}

    try {

      if (modal.type === 'create') {

  let attachmentUrl = '';

  if (attachmentFile) {
    const uploadForm = new FormData();
    uploadForm.append('file', attachmentFile);

    const uploaded = await uploadFile(uploadForm);
    attachmentUrl = uploaded.url;
  }

  await post('/tickets', {
          title: form.title,
          description:
            form.description,
          category_id:
            Number(
              form.category_id
            ),
          priority:
            form.priority,
          assigned_to:
            form.assigned_to
              ? Number(
                  form.assigned_to
                )
              : null,
          due_date:
            form.due_date
              ? new Date(
                  form.due_date
                ).toISOString()
              : null,
              
        attachment_url: attachmentUrl,
        });

      } else {

        let resolutionAttachmentUrl = '';

if (resolutionAttachmentFile) {
  const uploadForm = new FormData();
  uploadForm.append('file', resolutionAttachmentFile);

  const uploaded = await uploadFile(uploadForm);
  resolutionAttachmentUrl = uploaded.url;
}

await patch(
  '/tickets/' + t.id,
  {
    priority: form.priority,
    status: form.status,
    assigned_to: form.assigned_to
      ? Number(form.assigned_to)
      : null,
    due_date: form.due_date
      ? new Date(form.due_date).toISOString()
      : null,
    resolution: form.resolution,
    resolution_attachment_url: resolutionAttachmentUrl
    
  }
);

if (sendEmail && form.resolution.trim()) {
  await post(`/tickets/${t.id}/send-email`, {
    message: form.resolution.trim(),
    attachment_url: emailAttachmentUrl
  });
}
      }

      onSaved();

    } catch (e) {

      setMsg(e.message);

    }
  }

  return (
    <div className="modal-backdrop">

      <div
  className="modal"
  style={{
    width: '95%',
    maxWidth: 900,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}
>

        <div className="modal-head">

          <span>
            <Ticket size={16} />

            {modal.type === 'create'
              ? 'Create Ticket'
              : 'Edit Ticket'}
          </span>


          <button
            className="icon-btn"
            style={{ color: '#fff' }}
            onClick={onClose}
          >
            <X />
          </button>

        </div>


        <div
  className="modal-body"
  style={{
    flex: 1,
    overflowY: 'auto',
    minHeight: 0
  }}
>

          {msg && (
            <div className="error">
              {msg}
            </div>
          )}


          <div className="field">

            <div className="ai-row">

              <label>
                Title *
              </label>

              <button
                className="btn btn-ai"
                onClick={() =>
                  improve('title')
                }
                disabled={improvingTitle || modal.type === 'edit'}
              >
                <Sparkles size={13} />

                {improvingTitle
  ? 'Improving...'
  : 'Improve with AI'}
              </button>

            </div>


            <input
              readOnly={
                modal.type === 'edit'
              }
              value={form.title}
              placeholder="Enter a brief, descriptive title for the ticket"
              onChange={(e) =>
                setForm({
                  ...form,
                  title:
                    e.target.value
                })
              }
            />

          </div>


          <div
            className="field"
            style={{ marginTop: 12 }}
          >

            <div className="ai-row">

              <label>
                Description *
              </label>

              <button
                className="btn btn-ai"
                onClick={() =>
                  improve(
                    'description'
                  )
                }
                disabled={improvingDescription || modal.type === 'edit'}
              >
                <Sparkles size={13} />

                {improvingDescription
  ? 'Improving...'
  : 'Improve with AI'}
              </button>

        

            </div>


            <textarea
              readOnly={
                modal.type === 'edit'
              }
              value={
                form.description
              }
              placeholder="Provide a detailed description of the issue, including any error messages, steps to reproduce, and impact on your work"
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value
                })
              }
            />

          </div>


          {modal.type === 'create' && (

            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent:
                  'flex-end'
              }}
            >

              <button
                className="btn btn-ai"
                disabled={
                  classifying ||
                  !form.title ||
                  !form.description
                }
                onClick={async () => {

                  setClassifying(true);

                  try {

                    const d =
                      await post(
                        '/ai/classify',
                        {
                          title:
                            form.title,
                          description:
                            form.description
                        }
                      );

                    const c =
                      cats.find(
                        (x) =>
                          x.name ===
                          d.category
                      );

                    setForm((f) => ({
                      ...f,
                      priority:
                        d.priority,
                      category_id:
                        c
                          ? c.id
                          : f.category_id
                    }));

                  } catch (e) {

                    setMsg(e.message);

                  } finally {

                    setClassifying(false);

                  }

                }}
              >

                <Sparkles size={13} />

                {classifying
                  ? 'Analyzing...'
                  : 'Analyze Ticket with AI'}

              </button>

            </div>

          )}


          <div
            className="two"
            style={{
              marginTop: 12
            }}
          >

            <div className="field">

              <label>
                Category *
              </label>

              <select
                disabled={
                  modal.type === 'edit'
                }
                value={
                  form.category_id
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Select Category
                </option>

                {cats.map((c) => (
                  <option
                    value={c.id}
                    key={c.id}
                  >
                    {c.name}
                  </option>
                ))}

              </select>

            </div>


            <div className="field">

              <label>
                Priority *
              </label>

              <select
                value={
                  form.priority
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority:
                      e.target.value
                  })
                }
              >

                {[
                  'Low',
                  'Medium',
                  'High',
                  'Urgent'
                ].map((x) => (

                  <option
                    key={x}
                    value={x}
                  >
                    {x}
                  </option>

                ))}

              </select>

            </div>

          </div>


          {modal.type === 'edit' && (

            <div
              className="two"
              style={{
                marginTop: 12
              }}
            >

              <div className="field">

                <label>
                  Status *
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value
                    })
                  }
                >

                  {[
                    'Open',
                    'In Progress',
                    'Pending',
                    'Resolved',
                    'Closed'
                  ].map((x) => (

                    <option
                      key={x}
                      value={x}
                    >
                      {x}
                    </option>

                  ))}

                </select>

              </div>


              <div className="field">

                <label>
                  Assigned To
                </label>

                <select
                  value={
                    form.assigned_to
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assigned_to:
                        e.target.value
                    })
                  }
                >

                  <option value="">
                    Unassigned
                  </option>

                  {agents.map((a) => (

                    <option
                      key={a.id}
                      value={a.id}
                    >
                      {a.full_name}
                    </option>

                  ))}

                </select>

              </div>

            </div>

                    )}

          {modal.type === 'edit' && (

  <div
    className="field"
    style={{
      marginTop: 12
    }}
  >

    <label>
      Due Date
    </label>

    <input
      type="datetime-local"
      value={form.due_date}
      onChange={(e) =>
        setForm({
          ...form,
          due_date: e.target.value
        })
      }
    />

  </div>

)}


          {modal.type === 'create' && (
  <div
    className="field"
    style={{ marginTop: 12 }}
  >
    <label>
      Attachment
    </label>

    <input
  type="file"
  multiple
  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
  onChange={(e) => {
    setAttachmentFile(e.target.files[0] || null);
  }}
/>

    <small className="muted">
      You can upload images, PDF, Word or text files.
      Maximum 10MB per file.
    </small>
  </div>
)}

{modal.type === 'edit' && t?.attachment_url && (
  <div
    className="field"
    style={{
      marginTop: 12
    }}
  >
    <label>Attachments</label>

    <div
      style={{
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 6
      }}
    >
      <Paperclip size={16} />

      <a
        href={'http://localhost:8000' + t.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginLeft: 8 }}
      >
        View Original Attachment
      </a>
    </div>
  </div>
)}

          {modal.type === 'edit' && (

            <div
              className="field"
              style={{
                marginTop: 12
              }}
            >

<label className="form-label">Solution / Email Message</label>
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  }}
>
  <label>
    Resolution / Solution
  </label>

  <button
    type="button"
    className="btn btn-ai"
    disabled={emailAiLoading}
    onClick={async () => {
      setEmailAiLoading(true);
      setMsg('');

      try {
        const ticketInfo = `
Ticket Code: ${t?.ticket_code || ''}
Title: ${t?.title || ''}
Description: ${t?.description || ''}
Category: ${t?.category_name || ''}
Priority: ${form.priority || ''}
Status: ${form.status || ''}
Assigned Agent: ${t?.assignee_name || ''}
`;

        const result = await post(
          '/ai/draft-solution',
          {
            text: ticketInfo
          }
        );

        setForm({
          ...form,
          resolution: result.result || ''
        });

      } catch (e) {
        setMsg(e.message);
      } finally {
  setEmailAiLoading(false);
}
    }}
  >
    <Sparkles size={13} />

    {emailAiLoading
  ? 'Generating...'
  : 'Generate Solution with AI'}
  </button>
</div>

<textarea
  value={form.resolution}
  placeholder="Enter the solution provided to the user..."
  onChange={(e) =>
    setForm({
      ...form,
      resolution: e.target.value
    })
  }
/>

<small className="muted">
  Enter or generate the solution before marking the ticket as Resolved.
</small>


  <div
  className="field"
  style={{
    marginTop: 12
  }}
>
  <label>
    Solution Attachment
  </label>

  <input
    type="file"
    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
    onChange={(e) => {
      setResolutionAttachmentFile(
        e.target.files[0] || null
      );
    }}
  />

  <small className="muted">
    Attach a file related to the solution. Maximum 10MB.
  </small>
</div>

            </div>

          )}

        {modal.type === 'edit' && (

  <div
    className="panel"
    style={{
      marginTop: 16
    }}
  >

    <div className="panel-title">
      ✉ Send Custom Email to Requester
    </div>

    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12
      }}
    >

      <input
  type="checkbox"
  checked={sendEmail}
onChange={(e) => setSendEmail(e.target.checked)}
/>

      Send email notification to ticket creator

    </label>


    

<div
  style={{
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap'
  }}
>
  <label
    className="btn btn-secondary"
    style={{
      cursor: uploadingFile ? 'not-allowed' : 'pointer'
    }}
  >
    📎 Upload File

    <input
      type="file"
      hidden
      disabled={uploadingFile}
      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(
            `${API_BASE}/uploads`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: formData
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || 'File upload failed');
          }

          setEmailAttachmentUrl(data.url);
          setMsg(`File uploaded: ${file.name}`);
        } catch (e) {
          setMsg(e.message);
        } finally {
          setUploadingFile(false);
          e.target.value = '';
        }
      }}
    />
  </label>

  <input
    type="text"
    placeholder="Or paste URL here..."
    value={emailAttachmentUrl}
    onChange={(e) => setEmailAttachmentUrl(e.target.value)}
    style={{
      flex: 1,
      minWidth: 180
    }}
  />
</div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 8
      }}
    >

      
    </div>

  </div>

)}

{modal.type === 'edit' && (

  <div
    className="panel"
    style={{
      marginTop: 16
    }}
  >

    <div className="panel-title">
      💬 Comments & Activity
    </div>

    {comments.length > 0 && (
  <div style={{ marginTop: 12 }}>
    {comments.map((comment) => (
      <div
        key={comment.id}
        style={{
          padding: 12,
          marginBottom: 8,
          border: '1px solid #ddd',
          borderRadius: 8,
          background: comment.internal
            ? '#fff8e1'
            : '#f8fafc'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <strong>
            {comment.author_name}
          </strong>

          <small className="muted">
            {comment.created_at
              ? new Date(
                  comment.created_at
                ).toLocaleString()
              : ''}
          </small>
        </div>

        {comment.internal && (
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              fontWeight: 600
            }}
          >
            🔒 Internal Note
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          {comment.body}
        </div>

        {comment.attachment_url && (
  <div style={{ marginTop: 8 }}>
    📎{' '}
    <a
      href={`${API_BASE}${comment.attachment_url}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open Attachment
    </a>
  </div>
)}
      </div>
    ))}
  </div>
)}

    <div
      className="field"
      style={{
        marginTop: 12
      }}
    >

      <textarea
  placeholder="Add a comment..."
  value={commentText}
  onChange={(e) => setCommentText(e.target.value)}
  style={{
    minHeight: 140,
    width: '100%',
    resize: 'vertical'
  }}
/>

    </div>


    <div
      style={{
        display: 'flex',
        gap: 8,
        marginTop: 8,
        flexWrap: 'wrap'
      }}
    >

      <label
  className="btn btn-secondary"
  style={{ cursor: uploadingFile ? 'not-allowed' : 'pointer' }}
>
  📎 {uploadingFile ? 'Uploading...' : 'Upload File'}

  <input
    type="file"
    hidden
    disabled={uploadingFile}
    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingFile(true);
      setMsg('');

      if (
  modal.type === 'edit' &&
  form.status === 'Resolved' &&
  !form.resolution.trim()
) {
  setMsg(
    'Please enter a resolution before marking the ticket as Resolved.'
  );
  return;
}

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${API_BASE}/uploads`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'File upload failed');
        }

        setCommentText((current) =>
          current
            ? `${current}\n${data.url}`
            : data.url
        );

        setMsg(`File uploaded: ${file.name}`);
      } catch (e) {
        setMsg(e.message);
      } finally {
        setUploadingFile(false);
        e.target.value = '';
      }
    }}
  />
</label>


      <input
  type="text"
  placeholder="Or paste URL here..."
  value={commentUrl}
  onChange={(e) => setCommentUrl(e.target.value)}
  style={{
    flex: 1,
    minWidth: 180
  }}
/>


  <button
  type="button"
  className="btn btn-secondary"
  onClick={() => {
    if (!commentUrl.trim()) {
      setMsg('Please enter a URL.');
      return;
    }

    setCommentText((current) =>
  current
    ? `${current}\n${commentUrl.trim()}`
    : commentUrl.trim()
);

setMsg('URL added to comment.');
    setCommentUrl('');
    setMsg('');
  }}
>
  🔗 Add URL
</button>

    </div>


    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12
      }}
    >

      {user?.role !== 'user' && (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <input
      type="checkbox"
      checked={internalNote}
      onChange={(e) => setInternalNote(e.target.checked)}
    />
    Internal Note
  </label>
)}
      <span className="muted">
        (Visible to agents only)
      </span>

    </label>


    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 10
      }}
    >

      <button
  type="button"
  className="btn btn-primary"
  onClick={addComment}
  disabled={commentLoading}
>
  ➤ {commentLoading ? 'Adding...' : 'Add Comment'}
</button>

    </div>

  </div>

)}


         
        </div>


        <div className="modal-foot">

          <div className="modal-foot">

  {(form.status === 'Resolved' || form.status === 'Closed') && (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() =>
        setForm({
          ...form,
          status: 'Open'
        })
      }
    >
      ↩ Reopen Ticket
    </button>
  )}

  <button
    className="btn btn-primary"
    onClick={save}
  >
    {modal.type === 'create'
      ? 'Create Ticket'
      : 'Update Ticket'}
  </button>

  <button
    className="btn btn-secondary"
    onClick={onClose}
  >
    Cancel
  </button>

</div>


          

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   CATEGORIES
========================================================= */

function Categories() {

  const [cats, setCats] =
    useState([]);

  const [categorySearch, setCategorySearch] =
  useState('');

  const [dateFrom, setDateFrom] =
  useState('');

  const [dateTo, setDateTo] =
  useState('');

  const [departmentFilter, setDepartmentFilter] =
  useState('All Departments');

  const [modal, setModal] =
    useState(false);

  const [form, setForm] =
    useState({
      name: '',
      description: '',
      department: 'IT Support',
      color: '#0074D9',
      sla_hours: 24,
      status: 'active'
    });


  const load = () =>
    get('/categories')
      .then(setCats)
      .catch(() => {});


  useEffect(load, []);


  async function save() {

    await post(
      '/categories',
      {
        ...form,
        sla_hours:
          Number(
            form.sla_hours
          )
      }
    );

    setModal(false);

    load();
  }


  return (
    <>

      <div className="toolbar">

        <h2>
          Categories Management
        </h2>

        <button
          className="btn btn-success"
          onClick={() =>
            setModal(true)
          }
        >
          <Plus size={15} />

          Add Category
        </button>

      </div>


      <div className="panel">

        <div className="filters">

          <div className="filter-grid">

            <div className="field">
              <input
  type="date"
  value={dateFrom}
  onChange={(e) =>
    setDateFrom(e.target.value)
  }
/>
            </div>

            <div className="field">
              <input
  type="date"
  value={dateTo}
  onChange={(e) =>
    setDateTo(e.target.value)
  }
/>
            </div>

            <div className="field">
              <label>
                CATEGORY NAME
              </label>

              <input
  placeholder="Search by name..."
  value={categorySearch}
  onChange={(e) =>
    setCategorySearch(e.target.value)
  }
/>
            </div>

            <div className="field">
              <label>
                DEPARTMENT
              </label>

              <select
  value={departmentFilter}
  onChange={(e) =>
    setDepartmentFilter(e.target.value)
  }
>
  <option value="All Departments">
    All Departments
  </option>
  <option value="IT Support">
    IT Support
  </option>
  <option value="Help Desk">
    Help Desk
  </option>
  <option value="Facilities">
    Facilities
  </option>
  <option value="HR">
    HR
  </option>
</select>
            </div>

          </div>

        </div>




        <div className="table-wrap">

          <table className="table">

            <thead>

              <tr>
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Department</th>
                <th>Color</th>
                <th>SLA Hours</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {cats
  .filter((c) => {
    const categoryDate = new Date(c.created_at)
      .toISOString()
      .slice(0, 10);

    const matchesName = c.name
      .toLowerCase()
      .includes(categorySearch.toLowerCase());

    const matchesFrom =
      !dateFrom || categoryDate >= dateFrom;

    const matchesTo =
      !dateTo || categoryDate <= dateTo;

    const matchesDepartment =
      departmentFilter === 'All Departments' ||
      c.department === departmentFilter;

    return (
      matchesName &&
      matchesFrom &&
      matchesTo &&
      matchesDepartment
    );
  })
  .map((c) => (

                <tr key={c.id}>

                  <td>
                    {c.category_code}
                  </td>

                  <td>
                    {c.name}
                  </td>

                  <td>
                    {c.description}
                  </td>

                  <td>
                    {c.department}
                  </td>

                  <td>

                    <span
                      style={{
                        display:
                          'inline-block',
                        width: 20,
                        height: 20,
                        background:
                          c.color
                      }}
                    />

                    {' '}

                    {c.color}

                  </td>

                  <td>

                    <span className="badge b-medium">
                      {c.sla_hours}h
                    </span>

                  </td>

                  <td>
                    {c.status}
                  </td>

                  <td>
                    {new Date(
                      c.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="actions">

                    <button className="icon-btn edit">
                      <Edit size={17} />
                    </button>

                    <button
  className="icon-btn trash"
  onClick={async () => {
    if (!window.confirm(`Delete category "${c.name}"?`)) {
      return;
    }

    try {
      await del(`/categories/${c.id}`);
      load();
    } catch (e) {
      alert(e.message);
    }
  }}
>
  <Trash2 size={17} />
</button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {modal && (

        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-head">

              Add Category

              <button
                className="icon-btn"
                style={{
                  color: '#fff'
                }}
                onClick={() =>
                  setModal(false)
                }
              >
                <X />
              </button>

            </div>


            <div className="modal-body">

              {Object.keys(form).map(
                (k) => (

                  <div
                    className="field"
                    key={k}
                  >

                    <label>
                      {k
                        .replace(
                          '_',
                          ' '
                        )
                        .toUpperCase()}
                    </label>


                    {k === 'status' ? (

                      <select
                        value={form[k]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [k]:
                              e.target
                                .value
                          })
                        }
                      >

                        <option>
                          active
                        </option>

                        <option>
                          inactive
                        </option>

                      </select>

                    ) : (

                      <input
                        type={
                          k ===
                          'sla_hours'
                            ? 'number'
                            : k ===
                              'color'
                              ? 'color'
                              : 'text'
                        }
                        value={form[k]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [k]:
                              e.target
                                .value
                          })
                        }
                      />

                    )}

                  </div>

                )
              )}


              <div className="modal-foot">

                <button
                  className="btn btn-primary"
                  onClick={save}
                >
                  Save
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setModal(false)
                  }
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


/* =========================================================
   USERS MANAGEMENT
========================================================= */

/*
  IMPORTANT:
  This component is named UsersPage instead of Users.
  The Users name is already used by lucide-react.
*/

function UsersPage() {

  const [users, setUsers] =
  useState([]);

  const [userSearch, setUserSearch] =
  useState('');

  const [roleFilter, setRoleFilter] =
  useState('All Roles');

  const [departmentFilter, setDepartmentFilter] =
  useState('All Departments');

  const [statusFilter, setStatusFilter] =
  useState('All Status');

  const [userModal, setUserModal] =
  useState(false);

  const [editUserModal, setEditUserModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [editUserForm, setEditUserForm] = useState({
  username: '',
  full_name: '',
  email: '',
  password: '',
  role: 'user',
  department: '',
  phone: '',
  status: 'Active'
});

  const [userForm, setUserForm] = useState({
  username: '',
  full_name: '',
  email: '',
  password: '',
  role: 'user',
  department: '',
  phone: '',
  status: 'Active'
});

  useEffect(() => {

    get('/users')
      .then(setUsers)
      .catch(() => {});

  }, []);


  return (
    <>

      <div className="toolbar">

        <h2>
          Users
        </h2>

        <button
  className="btn btn-success"
  onClick={() => setUserModal(true)}
>
  <Plus size={15} />
  Add
</button>

      </div>


      <div className="panel">

        <div className="filters">

          <div className="filter-grid">

            <div className="field">

              <label>
                SEARCH
              </label>

              <input
  placeholder="Search users..."
  value={userSearch}
  onChange={(e) =>
    setUserSearch(e.target.value)
  }
/>

            </div>


            <div className="field">

              <label>
                ROLE
              </label>

              <select
  value={roleFilter}
  onChange={(e) =>
    setRoleFilter(e.target.value)
  }
>
  <option value="All Roles">
    All Roles
  </option>
  <option value="admin">
    Admin
  </option>
  <option value="agent">
    Agent
  </option>
  <option value="user">
    User
  </option>
</select>

            </div>


            <div className="field">

              <label>
                DEPARTMENT
              </label>

              <select
  value={departmentFilter}
  onChange={(e) =>
    setDepartmentFilter(e.target.value)
  }
>
  <option value="All Departments">
    All Departments
  </option>
  <option value="IT Support">
    IT Support
  </option>
  <option value="Help Desk">
    Help Desk
  </option>
  <option value="Facilities">
    Facilities
  </option>
  <option value="HR">
    HR
  </option>
</select>

            </div>


            <div className="field">

              <label>
                STATUS
              </label>

              <select
  value={statusFilter}
  onChange={(e) =>
    setStatusFilter(e.target.value)
  }
>
  <option value="All Status">
    All Status
  </option>
  <option value="Active">
    Active
  </option>
  <option value="Inactive">
    Inactive
  </option>
</select>

            </div>

          </div>

        </div>



        <div className="table-wrap">

          <table className="table">

            <thead>

              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {users
  .filter((u) => {
    const search = userSearch.toLowerCase();

    const matchesSearch =
      u.username.toLowerCase().includes(search) ||
      u.full_name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search);

    const matchesRole =
      roleFilter === 'All Roles' ||
      u.role === roleFilter;

    const matchesDepartment =
      departmentFilter === 'All Departments' ||
      u.department === departmentFilter;

    const matchesStatus =
      statusFilter === 'All Status' ||
      u.status === statusFilter;

    return (
      matchesSearch &&
      matchesRole &&
      matchesDepartment &&
      matchesStatus
    );
  })
  .map((u) => (

                <tr key={u.id}>

                  <td>
                    {u.user_code}
                  </td>

                  <td>
                    {u.username}
                  </td>

                  <td>
                    {u.full_name}
                  </td>

                  <td>
                    {u.email}
                  </td>

                  <td>
                    {u.role}
                  </td>

                  <td>
                    {u.department}
                  </td>

                  <td>
                    {u.phone}
                  </td>

                  <td>
                    {u.status}
                  </td>

                  <td>
                    {new Date(
                      u.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="actions">

                    <button
  className="icon-btn edit"
  onClick={() => {
    setEditingUser(u);

    setEditUserForm({
      username: u.username || '',
      full_name: u.full_name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'user',
      department: u.department || '',
      phone: u.phone || '',
      status: u.status || 'Active'
    });

    setEditUserModal(true);
  }}
>
  <Edit size={17} />
</button>

                    <button
  className="icon-btn trash"
  title="Delete User"
  onClick={async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${u.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await del(`/users/${u.id}`);

      setUsers((prev) =>
        prev.filter((item) => item.id !== u.id)
      );

    } catch (e) {
      alert(e.message);
    }
  }}
>
  <Trash2 size={17} />
</button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

          {userModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              Add User

              <button
                className="icon-btn"
                style={{ color: '#fff' }}
                onClick={() => setUserModal(false)}
              >
                <X />
              </button>
            </div>

            <div className="modal-body">

              <div className="two">

                <div className="field">
                  <label>Username</label>
                  <input
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        username: e.target.value
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>Full Name</label>
                  <input
                    value={userForm.full_name}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        full_name: e.target.value
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input
  type="email"
  autoComplete="off"
  value={userForm.email}
  onChange={(e) =>
    setUserForm({
      ...userForm,
      email: e.target.value
    })
  }
/>
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
  type="password"
  autoComplete="new-password"
  value={userForm.password}
  onChange={(e) =>
    setUserForm({
      ...userForm,
      password: e.target.value
    })
  }
/>
                </div>

                <div className="field">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role: e.target.value
                      })
                    }
                  >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="field">
                  <label>Department</label>
                  <input
                    value={userForm.department}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        department: e.target.value
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>Phone</label>
                  <input
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        phone: e.target.value
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        status: e.target.value
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

              </div>

              <div className="modal-foot">

                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      const created = await post('/users', userForm);

                      setUsers((prev) => [...prev, created]);

                      setUserModal(false);

                      setUserForm({
                        username: '',
                        full_name: '',
                        email: '',
                        password: '',
                        role: 'user',
                        department: '',
                        phone: '',
                        status: 'Active'
                      });

                    } catch (e) {
                      alert(e.message);
                    }
                  }}
                >
                  Save User
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setUserModal(false)}
                >
                  Cancel
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    


    {editUserModal && (
  <div className="modal-backdrop">
    <div className="modal user-edit-modal">
      <div className="user-edit-header">
        <h3>Edit User</h3>
        <button
          className="icon-btn"
          onClick={() => setEditUserModal(false)}
        >
          ×
        </button>
      </div>

      <div className="form-grid">

        <label>
          Username
          <input
            value={editUserForm.username}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                username: e.target.value
              })
            }
          />
        </label>

        <label>
          Full Name
          <input
            value={editUserForm.full_name}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                full_name: e.target.value
              })
            }
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={editUserForm.email}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                email: e.target.value
              })
            }
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Leave blank to keep current password"
            value={editUserForm.password}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                password: e.target.value
              })
            }
          />
        </label>

        <label>
          Role
          <select
            value={editUserForm.role}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                role: e.target.value
              })
            }
          >
            <option value="user">User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label>
          Department
          <input
            value={editUserForm.department}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                department: e.target.value
              })
            }
          />
        </label>

        <label>
          Phone
          <input
            value={editUserForm.phone}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                phone: e.target.value
              })
            }
          />
        </label>

        <label>
          Status
          <select
            value={editUserForm.status}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                status: e.target.value
              })
            }
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

      </div>

      <div className="modal-actions">
        <button
          className="btn"
          onClick={() => setEditUserModal(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-success"
          onClick={async () => {
            try {
              const updated = await put(
                `/users/${editingUser.id}`,
                editUserForm
              );

              setUsers((prev) =>
                prev.map((u) =>
                  u.id === updated.id ? updated : u
                )
              );

              setEditUserModal(false);
              setEditingUser(null);

            } catch (e) {
              alert(e.message);
            }
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}


/* =========================================================
   EMAIL SETTINGS
========================================================= */

function Email() {

  const [items, setItems] =
    useState([]);

  const [modal, setModal] =
    useState(false);

  const [form, setForm] =
    useState({
      name: '',
      subject:
        'My ticket {{ticketid}}',
      body_html:
        '<p>Hello {{requester_name}},</p><p>Your ticket <b>{{ticketid}}</b> is now <b>{{ticket_status}}</b>.</p>',
      status: 'Active'
    });


  const load = () =>
    get('/email-templates')
      .then(setItems)
      .catch(() => {});


  useEffect(load, []);


  async function save() {

    await post(
      '/email-templates',
      form
    );

    setModal(false);

    load();
  }


  const vars = [
    '{{ticketid}}',
    '{{ticket_title}}',
    '{{ticket_description}}',
    '{{ticket_status}}',
    '{{ticket_priority}}',
    '{{ticket_category}}',
    '{{department}}',
    '{{requester_name}}',
    '{{requester_email}}',
    '{{agent_name}}',
    '{{created_date}}',
    '{{updated_date}}',
    '{{resolution}}'
  ];


  return (
    <>

      <div className="toolbar">

        <h2>
          Email Settings
        </h2>

        <button
          className="btn btn-success"
          onClick={() =>
            setModal(true)
          }
        >
          <Plus size={15} />

          Add Template
        </button>

      </div>


      <div className="panel">

        <div className="table-actions">

          <button className="btn btn-primary">
            CSV
          </button>

          <button className="btn btn-primary">
            PDF
          </button>

          <button className="btn btn-primary">
            Print
          </button>

        </div>


        <div className="table-wrap">

          <table className="table">

            <thead>

              <tr>
                <th>Template</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {items.map((x) => (

                <tr key={x.id}>

                  <td>
                    {x.name}
                  </td>

                  <td>
                    {x.subject}
                  </td>

                  <td>
                    {x.status}
                  </td>

                  <td>
                    {new Date(
                      x.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td>

                    <button className="icon-btn edit">
                      <Edit size={17} />
                    </button>

                    <button className="icon-btn trash">
                      <Trash2 size={17} />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {modal && (

        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-head">

              Add Email Template

              <button
                className="icon-btn"
                style={{
                  color: '#fff'
                }}
                onClick={() =>
                  setModal(false)
                }
              >
                <X />
              </button>

            </div>


            <div className="modal-body">

              <div className="field">

                <label>
                  Template Name *
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target.value
                    })
                  }
                />

              </div>


              <div className="field">

                <label>
                  Subject Line *
                </label>

                <input
                  value={
                    form.subject
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject:
                        e.target.value
                    })
                  }
                />

              </div>


              <div className="field">

                <label>
                  Email Body
                  (HTML Supported) *
                </label>

                <textarea
                  style={{
                    minHeight: 170
                  }}
                  value={
                    form.body_html
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      body_html:
                        e.target.value
                    })
                  }
                />

              </div>


              <div className="field">

                <label>
                  Status
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value
                    })
                  }
                >

                  <option>
                    Active
                  </option>

                  <option>
                    Inactive
                  </option>

                </select>

              </div>


              <div
                className="panel"
                style={{
                  marginTop: 12
                }}
              >

                <div className="panel-title">
                  Available Variables
                </div>


                <div
                  style={{
                    padding: 10,
                    display: 'flex',
                    gap: 6,
                    flexWrap:
                      'wrap'
                  }}
                >

                  {vars.map((v) => (

                    <button
                      key={v}
                      className="btn btn-secondary"
                      onClick={() =>
                        setForm({
                          ...form,
                          body_html:
                            form.body_html +
                            ' ' +
                            v
                        })
                      }
                    >
                      {v}
                    </button>

                  ))}

                </div>

              </div>


              <div className="modal-foot">

                <button
                  className="btn btn-primary"
                  onClick={save}
                >
                  Save Template
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setModal(false)
                  }
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


/* =========================================================
   AI KNOWLEDGE BASE
========================================================= */

function Knowledge() {
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [ans, setAns] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(question = q) {
    const text = question.trim();

    if (!text) {
      return;
    }

    setSubmittedQ(text);
    setQ('');
    setLoading(true);

    try {
      const d = await post('/ai/rag', {
        question: text
      });

      setAns(d.answer);
    } catch (e) {
      setAns(e.message);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    'How do I reset my company password?',
    'How can I connect to the company VPN?',
    'My printer is not working',
    'How do I install company software?'
  ];

  return (
    <div className="knowledge-page">

      <div className="knowledge-header">
        <div>
          <div className="knowledge-title">
            <BookOpen size={20} />
            AI Knowledge Assistant
          </div>

          <div className="knowledge-subtitle">
            Get instant answers from the company knowledge base
          </div>
        </div>
      </div>


      <div className="knowledge-chat">

        <div className="knowledge-welcome">
          <div className="ai-avatar">
            AI
          </div>

          <div>
            <h3>How can I help you?</h3>

            <p>
              Ask me about passwords, VPN, printers, software,
              network problems, or other IT support topics.
            </p>
          </div>
        </div>


        {!ans && !loading && (
          <div className="knowledge-suggestions">

            <div className="suggestions-title">
              Suggested questions
            </div>

            <div className="suggestions-grid">

              {suggestions.map((item, index) => (
                <button
                  key={index}
                  className="suggestion-card"
                  onClick={() => ask(item)}
                >
                  <span className="suggestion-icon">
                    {index === 0 && '🔐'}
                    {index === 1 && '🌐'}
                    {index === 2 && '🖨️'}
                    {index === 3 && '💻'}
                  </span>

                  <span>{item}</span>
                </button>
              ))}

            </div>

          </div>
        )}


        {(q || loading || ans) && (
          <div className="knowledge-conversation">

            {submittedQ && (
  <div className="chat-row user-row">

                <div className="user-message">
                  {submittedQ}
                </div>

              </div>
            )}


            {loading && (
              <div className="chat-row ai-row">

                <div className="ai-avatar small">
                  AI
                </div>

                <div className="ai-message">
                  <div className="message-label">
                    AI Assistant
                  </div>

                  <div className="typing">
                    Searching the knowledge base...
                  </div>
                </div>

              </div>
            )}


            {ans && !loading && (
              <div className="chat-row ai-row">

                <div className="ai-avatar small">
                  AI
                </div>

                <div className="ai-message">

                  <div className="message-label">
                    AI Assistant
                  </div>

                  <div className="answer-text">
                    {ans}
                  </div>

                  <div className="source-label">
                    📚 Answer generated from the knowledge base
                  </div>

                </div>

              </div>
            )}

          </div>
        )}


        <div className="knowledge-input-area">

          <input
            className="knowledge-input"
            placeholder="Ask a question about IT support..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                ask();
              }
            }}
          />

          <button
            className="knowledge-ask-btn"
            onClick={() => ask()}
            disabled={loading}
          >
            <Send size={16} />

            {loading ? 'Searching...' : 'Ask AI'}
          </button>

        </div>

      </div>

    </div>
  );
}
/* =========================================================
   LOGS
========================================================= */

function Logs() {

  const [rows, setRows] =
    useState([]);


  useEffect(() => {

    get('/audit-logs')
      .then(setRows)
      .catch(() => {});

  }, []);


  return (

    <div className="panel">

      <div className="panel-title">
        Audit Logs
      </div>


      <div className="table-wrap">

        <table className="table">

          <thead>

            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>Actor</th>
              <th>Created</th>
            </tr>

          </thead>


          <tbody>

            {rows.map((r) => (

              <tr key={r.id}>

                <td>
                  {r.action}
                </td>

                <td>
                  {r.entity_type} #
                  {r.entity_id}
                </td>

                <td>
                  {r.details}
                </td>

                <td>
                  {r.actor}
                </td>

                <td>
                  {new Date(
                    r.created_at
                  ).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

function MyLogs() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    get('/my-logs')
      .then(setRows)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2 style={{ margin: 0 }}>My Logs</h2>
          <div className="muted">
            View your recent helpdesk activities and actions.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          My Activity
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Ticket</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="muted">
                    No activities found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {new Date(r.created_at).toLocaleString()}
                    </td>

                    <td>
                      {r.action}
                    </td>

                    <td>
                      {r.entity_type === 'ticket'
                        ? `#${r.entity_id}`
                        : '-'}
                    </td>

                    <td>
                      {r.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PLACEHOLDER
========================================================= */

function Attachments() {

  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    get('/tickets')
      .then(setTickets)
      .catch(() => {});
  }, []);

  const attachments = [];

  tickets.forEach((ticket) => {

    if (ticket.attachment_url) {
      attachments.push({
        ticket_code: ticket.ticket_code,
        title: ticket.title,
        type: 'Ticket Attachment',
        url: ticket.attachment_url
      });
    }

    if (ticket.resolution_attachment_url) {
      attachments.push({
        ticket_code: ticket.ticket_code,
        title: ticket.title,
        type: 'Solution Attachment',
        url: ticket.resolution_attachment_url
      });
    }

  });

  return (
    <div className="panel">

      <div className="panel-title">
        Attachments
      </div>

      <div className="table-wrap">

        <table className="table">

          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Attachment Type</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {attachments.length === 0 ? (

              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: 'center',
                    padding: 20
                  }}
                  className="muted"
                >
                  No attachments found.
                </td>
              </tr>

            ) : (

              attachments.map((file, index) => (

                <tr key={index}>

                  <td>
                    {file.ticket_code}
                  </td>

                  <td>
                    {file.title}
                  </td>

                  <td>
                    {file.type}
                  </td>

                  <td>
                    <a
                      href={
                        'http://localhost:8000' +
                        file.url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Attachment
                    </a>
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

function Placeholder({
  name
}) {

  return (

    <div className="panel">

      <div className="panel-title">
        {name}
      </div>

      <div
        style={{
          padding: 25
        }}
        className="muted"
      >
        This module is scaffolded
        and ready for the same
        enterprise UI pattern.
      </div>

    </div>

  );
}



/* =========================================================
   MY ACCOUNT
========================================================= */

function MyAccount({ user }) {
  const [editing, setEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    department: user?.department || ''
  });

  const [passwordForm, setPasswordForm] = useState({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2>My Account</h2>
          <div className="muted">
            Manage your personal information and account security.
          </div>
        </div>
      </div>

            <div className="panel profile-header-panel">

        <div className="panel-title">
          👤 Profile
        </div>

        <div className="profile-header">

          <div className="profile-avatar-large">
            {(user?.full_name || user?.username || 'US')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="profile-header-info">

            <h2>
              {user?.full_name || 'User'}
            </h2>

            <div className="profile-username">
              @{user?.username || 'username'}
            </div>

            <div className="profile-meta">
              <span>{user?.role || 'User'}</span>
              <span>•</span>
              <span>{user?.department || 'IT Support'}</span>
            </div>

            <div className="profile-status">
              <span className="status-dot"></span>
              {user?.status || 'Active'}
            </div>

          </div>

        </div>

      </div>
      

            <div className="account-info-grid">

        <div className="panel account-info-panel">
          <div className="panel-title">
            👤 Personal Information
          </div>

          <div className="account-info-content">

            <div className="account-info-item">
              <div className="account-info-label">Full Name</div>
              <div className="account-info-value">
                {user?.full_name || '-'}
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-label">Email</div>
              <div className="account-info-value">
                {user?.email || '-'}
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-label">Department</div>
              <div className="account-info-value">
                {user?.department || '-'}
              </div>
            </div>

          </div>
        </div>


        <div className="panel account-info-panel">
          <div className="panel-title">
            🛡️ Account Information
          </div>

          <div className="account-info-content">

            <div className="account-info-item">
              <div className="account-info-label">Username</div>
              <div className="account-info-value">
                {user?.username || '-'}
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-label">Role</div>
              <div className="account-info-value">
                {user?.role || '-'}
              </div>
            </div>

            <div className="account-info-item">
              <div className="account-info-label">Account Status</div>
              <div className="account-status-value">
                <span className="status-dot"></span>
                {user?.status || 'Active'}
              </div>
            </div>

          </div>
        </div>

      </div>
      
      <div className="panel">
  <div className="panel-title">
    ✏️ Edit Personal Information
  </div>

  <div style={{ padding: 20 }}>
    {!editing ? (
      <>
        <div className="edit-profile-row">

  <div>
    <div className="edit-profile-title">
      Update your profile information
    </div>

    <div className="muted">
      Change your name, email address, or department.
    </div>
  </div>

  <button
    className="btn btn-primary"
    onClick={() => setEditing(true)}
  >
    ✏️ Edit Profile
  </button>

</div>
      </>
    ) : (
      <div className="two">

        <div className="field">
          <label>Full Name</label>
          <input
  value={editForm.full_name}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      full_name: e.target.value
    })
  }
/>
        </div>

        <div className="field">
          <label>Email</label>
          <input
  type="email"
  value={editForm.email}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      email: e.target.value
    })
  }
/>
        </div>

        <div className="field">
          <label>Department</label>
          <input
  value={editForm.department}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      department: e.target.value
    })
  }
/>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <button
  className="btn btn-primary"
  onClick={async () => {
    try {
      const updatedUser = await patch('/me', editForm);

      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );

      setEditing(false);

      window.location.reload();
    } catch (e) {
      alert(e.message);
    }
  }}
>
  Save Changes
</button>

          <button
            className="btn btn-secondary"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>

      </div>
    )}
  </div>
</div>
   

<div className="panel">
  <div className="panel-title">
    🔐 Change Password
  </div>

  <div className="password-section">
    <div className="two">

      <div className="field">
        <label>Current Password</label>
        <input
          type="password"
          value={passwordForm.current_password}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              current_password: e.target.value
            })
          }
        />
      </div>

      <div className="field">
        <label>New Password</label>
        <input
          type="password"
          value={passwordForm.new_password}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              new_password: e.target.value
            })
          }
        />
      </div>

      <div className="field">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={passwordForm.confirm_password}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              confirm_password: e.target.value
            })
          }
        />
      </div>

    </div>


    <div className="password-actions">
    <button
  className="btn btn-primary"
  style={{ marginTop: 15 }}
  onClick={async () => {
    if (!passwordForm.current_password ||
        !passwordForm.new_password ||
        !passwordForm.confirm_password) {
      alert('Please fill all password fields.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New password and confirm password do not match.');
      return;
    }

    try {
      await patch('/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      alert('Password changed successfully.');

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (e) {
      alert(e.message);
    }
  }}
>
  Change Password
  </button>
  </div>
  </div>
</div>
</div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {

  const [user, setUser] =
    useState(() => {

      try {

        return JSON.parse(
          localStorage.getItem(
            'user'
          )
        );

      } catch {

        return null;

      }

    });


  const [page, setPage] =
    useState('dashboard');


  if (!user) {

    return (
      <Login
        onLogin={setUser}
      />
    );

  }


  let content =
  page === 'dashboard'
    ? (
        <Dashboard
          user={user}
          setPage={setPage}
        />
      )
    : page === 'account'
    ? (
        <MyAccount user={user} />
      )
    : page === 'tickets'
        ? (
            <Tickets
              user={user}
            />
          )

      : page === 'categories' &&
        user.role === 'admin'
        ? (
            <Categories />
          )

      : page === 'users' &&
        user.role === 'admin'
        ? (
            <UsersPage />
          )

      : page === 'email' &&
        user.role === 'admin'
        ? (
            <Email />
          )

      : page === 'knowledge'
        ? (
            <Knowledge />
          )

      : page === 'logs' &&
  user.role === 'admin'
  ? (
      <Logs />
    )

      : page === 'logs' &&
  user.role !== 'admin'
  ? (
      <MyLogs />
    )
          : page === 'attachments' &&
        user.role === 'admin'
        ? (
            <Attachments />
          )

      : (
          <Placeholder
            name={titleFor(page)}
          />
        );


  return (

    <Layout
      user={user}
      page={page}
      setPage={setPage}
    >
      {content}
    </Layout>

  );
}

/* =========================================================
   START REACT APPLICATION
========================================================= */
createRoot(
  document.getElementById('root')
).render(
  <App />
);