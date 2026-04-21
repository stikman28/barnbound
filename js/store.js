/* =========================================================
   BarnBound Prototype — localStorage helper
   Keeps user-created content (events, threads, groups, reviews,
   joins, trail rides) across page reloads during a demo.
   ========================================================= */

const Store = {
  KEYS: {
    events: 'bb_user_events',
    threads: 'bb_user_threads',
    groups: 'bb_user_groups',
    joinedGroups: 'bb_joined_groups',
    joinedThreads: 'bb_joined_threads',
    joinedEvents: 'bb_joined_events',
    reviews: 'bb_reviews',          // { businessId: [{id, rating, comment, date, author, likes}] }
    likes: 'bb_review_likes',        // { reviewKey: true } — reviewKey = `${businessId}:${reviewId}`
    trailRides: 'bb_trail_rides',
    users: 'bb_users',               // [{ email, passwordHash, name, location, role, joinedAt }]
    session: 'bb_session',           // { email, name }
  },

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Store write failed', e);
    }
  },

  // --- Events ---
  userEvents() { return this.read(this.KEYS.events, []); },
  addEvent(event) {
    const events = this.userEvents();
    event.id = 'u' + Date.now();
    event.userCreated = true;
    events.unshift(event);
    this.write(this.KEYS.events, events);
    return event;
  },
  joinedEvents() { return this.read(this.KEYS.joinedEvents, []); },
  joinEvent(id) {
    const j = this.joinedEvents();
    if (!j.includes(id)) { j.push(id); this.write(this.KEYS.joinedEvents, j); }
  },
  leaveEvent(id) {
    this.write(this.KEYS.joinedEvents, this.joinedEvents().filter(x => x !== id));
  },
  isJoinedEvent(id) { return this.joinedEvents().includes(id); },

  // --- Threads ---
  userThreads() { return this.read(this.KEYS.threads, []); },
  addThread(thread) {
    const threads = this.userThreads();
    thread.id = 'u' + Date.now();
    thread.userCreated = true;
    threads.unshift(thread);
    this.write(this.KEYS.threads, threads);
    return thread;
  },
  joinedThreads() { return this.read(this.KEYS.joinedThreads, []); },
  joinThread(id) {
    const j = this.joinedThreads();
    if (!j.includes(id)) { j.push(id); this.write(this.KEYS.joinedThreads, j); }
  },
  leaveThread(id) {
    this.write(this.KEYS.joinedThreads, this.joinedThreads().filter(x => x !== id));
  },
  isJoinedThread(id) { return this.joinedThreads().includes(id); },

  // --- Groups ---
  userGroups() { return this.read(this.KEYS.groups, []); },
  addGroup(group) {
    const groups = this.userGroups();
    group.id = 'u' + Date.now();
    group.userCreated = true;
    groups.unshift(group);
    this.write(this.KEYS.groups, groups);
    return group;
  },
  joinedGroups() { return this.read(this.KEYS.joinedGroups, []); },
  joinGroup(id) {
    const j = this.joinedGroups();
    if (!j.includes(id)) { j.push(id); this.write(this.KEYS.joinedGroups, j); }
  },
  leaveGroup(id) {
    this.write(this.KEYS.joinedGroups, this.joinedGroups().filter(x => x !== id));
  },
  isJoinedGroup(id) { return this.joinedGroups().includes(id); },

  // --- Reviews ---
  reviewsFor(businessId) {
    const all = this.read(this.KEYS.reviews, {});
    return all[businessId] || [];
  },
  addReview(businessId, review) {
    const all = this.read(this.KEYS.reviews, {});
    if (!all[businessId]) all[businessId] = [];
    review.id = 'r' + Date.now();
    review.date = new Date().toISOString();
    review.likes = 0;
    all[businessId].unshift(review);
    this.write(this.KEYS.reviews, all);
    return review;
  },
  toggleReviewLike(businessId, reviewId) {
    const key = `${businessId}:${reviewId}`;
    const likes = this.read(this.KEYS.likes, {});
    const all = this.read(this.KEYS.reviews, {});
    const review = (all[businessId] || []).find(r => r.id === reviewId);
    if (!review) return false;
    if (likes[key]) {
      delete likes[key];
      review.likes = Math.max(0, (review.likes || 0) - 1);
    } else {
      likes[key] = true;
      review.likes = (review.likes || 0) + 1;
    }
    this.write(this.KEYS.likes, likes);
    this.write(this.KEYS.reviews, all);
    return !!likes[key];
  },
  hasLiked(businessId, reviewId) {
    const likes = this.read(this.KEYS.likes, {});
    return !!likes[`${businessId}:${reviewId}`];
  },

  // --- Auth ---
  // NOTE: This is a prototype. Passwords are NOT securely hashed — a real
  // build would use a server-side auth provider (Firebase, Auth0, etc).
  _hash(s) {
    // tiny deterministic "hash" purely for the prototype (NOT SECURE)
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  },

  users() { return this.read(this.KEYS.users, []); },

  findUser(email) {
    const e = email.toLowerCase().trim();
    return this.users().find(u => u.email === e) || null;
  },

  registerUser({ name, email, password, location, role }) {
    email = email.toLowerCase().trim();
    if (this.findUser(email)) throw new Error('An account with that email already exists.');
    if (!name || !email || !password) throw new Error('Name, email, and password are required.');
    const user = {
      email,
      name: name.trim(),
      passwordHash: this._hash(password),
      location: (location || '').trim(),
      role: role || 'Rider',
      joinedAt: new Date().toISOString(),
    };
    const users = this.users();
    users.push(user);
    this.write(this.KEYS.users, users);
    this.setSession(user);
    return user;
  },

  signIn(email, password) {
    const user = this.findUser(email);
    if (!user || user.passwordHash !== this._hash(password)) {
      throw new Error('Email or password is incorrect.');
    }
    this.setSession(user);
    return user;
  },

  setSession(user) {
    this.write(this.KEYS.session, { email: user.email, name: user.name, role: user.role });
  },

  currentUser() {
    const s = this.read(this.KEYS.session, null);
    if (!s) return null;
    return this.findUser(s.email);
  },

  signOut() {
    try { localStorage.removeItem(this.KEYS.session); } catch {}
  },

  // --- Trail rides (map) ---
  trailRides() { return this.read(this.KEYS.trailRides, []); },
  addTrailRide(ride) {
    const rides = this.trailRides();
    ride.id = 't' + Date.now();
    rides.unshift(ride);
    this.write(this.KEYS.trailRides, rides);
    return ride;
  },
  removeTrailRide(id) {
    this.write(this.KEYS.trailRides, this.trailRides().filter(r => r.id !== id));
  },
};
