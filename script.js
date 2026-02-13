//js
// ================= GLOBAL VARIABLES =================
let userLoggedIn = false;
let currentUser = {};
let selectedMovie = {};
let bookedHistory = [];
let favoriteMovies = [];
let currentLang = "All";
let currentGenre = "All";
let selectedSeats = [];
let selectedTime = "";
let displayCount = 8;
const MAX_SEATS = 6;
let filteredMovies = [];

// ================= ELEMENTS =================
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginName = document.getElementById("loginName");
const loginEmail = document.getElementById("loginEmail");
const welcomeText = document.getElementById("welcomeText");
const cityModal = document.getElementById("cityModal");
const citySelect = document.getElementById("citySelect");
const hamburger = document.getElementById("hamburger");
const moviesContainer = document.getElementById("moviesContainer");
const seeMoreBtn = document.getElementById("seeMoreBtn");
const filtersContainer = document.getElementById("filtersContainer");
const bookingModal = document.getElementById("bookingModal");
const bookingPoster = document.getElementById("bookingPoster");
const movieTitle = document.getElementById("movieTitle");
const bookingDate = document.getElementById("bookingDate");
const showTimes = document.getElementById("showTimes");
const seatContainer = document.getElementById("seatContainer");
const totalPrice = document.getElementById("totalPrice");
const paymentMethod = document.getElementById("paymentMethod");
const cardDetails = document.getElementById("cardDetails");
const upiDetails = document.getElementById("upiDetails");
const userNameText = document.getElementById("userNameText");
const favList = document.getElementById("favList");
const historyList = document.getElementById("historyList");
const homeBtnContainer = document.getElementById("homeBtnContainer");
const searchInput = document.getElementById("searchInput");

// ================= MOVIES DATA =================
let movies = []; // regular movies
let upcomingMovies = JSON.parse(localStorage.getItem("upcomingMovies")) || [];

// ================= BOOKED SEATS STORAGE =================
let bookedSeats = JSON.parse(localStorage.getItem("bookedSeats")) || {};

// ================= FUNCTIONS =================
// ================= OPEN BOOKING =================
function openBooking(id) {
    if(!userLoggedIn){ alert("Login first"); return; }

    document.getElementById("movieDetailsModal").style.display = "none";
    selectedMovie = movies.find(m => m.id === id) || upcomingMovies.find(m => m.id === id);
    if(!selectedMovie) return;

    bookingModal.style.display = "flex";
    movieTitle.innerText = selectedMovie.title;
    bookingPoster.src = selectedMovie.image;

    // Dates
    bookingDate.innerHTML = "";
    for(let i=0;i<5;i++){
        let d = new Date();
        d.setDate(d.getDate()+i);
        bookingDate.innerHTML += `<option>${d.toDateString()}</option>`;
    }

    // Show times
    showTimes.innerHTML = "";
    const times = Array.isArray(selectedMovie.times) && selectedMovie.times.length ? selectedMovie.times : ["10:00 AM", "1:30 PM", "6:45 PM"];
    selectedTime = "";

    times.forEach(t => {
      const btn = document.createElement("button");
      btn.innerText = t;
      btn.onclick = () => selectTime(btn);
      showTimes.appendChild(btn);
    });

    selectedSeats = [];
    renderSeats();
    updatePrice();
}

// ================= RENDER SEATS =================
function renderSeats() {
  seatContainer.innerHTML = "";
  selectedSeats = [];

  if (!selectedMovie || !selectedMovie.id) return;

  const movieId = selectedMovie.id;
  const dateVal = bookingDate.value || new Date().toDateString();
  const timeVal = selectedTime || "";
  const dateTimeKey = `${timeVal}_${dateVal}`;

  const alreadyBooked = bookedSeats[movieId]?.[dateTimeKey] || [];

  for (let i = 1; i <= 80; i++) {
    let seat = document.createElement("div");
    seat.className = "seat";
    seat.innerText = i;

    if (alreadyBooked.includes(i)) seat.classList.add("booked");

    seat.onclick = () => {
      if (seat.classList.contains("booked")) return;

      if (seat.classList.contains("selected")) {
        seat.classList.remove("selected");
        selectedSeats = selectedSeats.filter(s => s !== i);
      } else {
        if (selectedSeats.length >= MAX_SEATS) {
          alert(`You can select a maximum of ${MAX_SEATS} seats`);
          return;
        }
        seat.classList.add("selected");
        selectedSeats.push(i);
      }

      updatePrice();
    };

    seatContainer.appendChild(seat);
  }

  document.getElementById("payBtn").disabled = selectedSeats.length === 0;
}

// ================= SELECT TIME =================
function selectTime(btn) {
  document.querySelectorAll("#showTimes button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedTime = btn.innerText;
  renderSeats();
}

// ================= LOGIN & LOGOUT =================
function openLogin() {
  if (localStorage.getItem("userLoggedIn") === "true") { alert("Already logged in"); return; }
  loginModal.style.display = "block";
}

function doLogin() {
    if (!nameValidation() || !emailValidation()) return;
    const name = loginName.value.trim();
    const email = loginEmail.value.trim();
    const user = { name, email };
    

    // Admin check
    if (name === "admin" && email=== "admin@bookmyshow.com") {
        localStorage.setItem("loggedInAdmin", "true");
        localStorage.setItem("currentUser", JSON.stringify(user));
        alert("Admin login successful");
        window.location.href = "admin.html";
        return;
    }

    // Normal user
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Load per-user favorites & history
    favoriteMovies = JSON.parse(localStorage.getItem(`fav_${email}`)) || [];
    bookedHistory = JSON.parse(localStorage.getItem(`history_${email}`)) || [];

    userLoggedIn = true;
    currentUser = user;

    loginModal.style.display = "none";
    loginBtn.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    hamburger.classList.remove("d-none");

    welcomeText.innerText = `Hi, ${name}`;
    userNameText.innerText = name;
    renderSidebar();

    alert("Login successful");
    
}

function logout() {
  // Save current user's data
  if (userLoggedIn) {
    localStorage.setItem(`fav_${currentUser.email}`, JSON.stringify(favoriteMovies));
    localStorage.setItem(`history_${currentUser.email}`, JSON.stringify(bookedHistory));
  }

  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("selectedCity");

  userLoggedIn = false;
  currentUser = {};
  favoriteMovies = [];
  bookedHistory = [];

  loginBtn.classList.remove("d-none");
  logoutBtn.classList.add("d-none");
  hamburger.classList.add("d-none");

  welcomeText.innerText = "";
  userNameText.innerText = "";

  renderSidebar();
  cityModal.style.display = "block";
}

// ================= CITY =================
function selectCity() {
  if (!citySelect.value) { alert("Please select city"); return; }
  localStorage.setItem("selectedCity", citySelect.value);
  cityModal.style.display = "none";
  renderFilters();
  filterAndDisplay();
}

// ================= FILTERS =================
function renderFilters() {
  filtersContainer.innerHTML = "";

  const allMovies = [...movies, ...upcomingMovies];

  const langs = ["All", ...new Set(allMovies.map(m => m.language).filter(l => l))];
  const genres = ["All", ...new Set(
    allMovies.flatMap(m => m.genre ? m.genre.split("-") : []).map(g => g.trim()).filter(Boolean)
  )];

  langs.forEach(l => {
    const btn = document.createElement("button");
    btn.textContent = l;
    btn.classList.add("lang-btn");
    if (l === currentLang) btn.classList.add("active");
    btn.onclick = () => {
      currentLang = l;
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndDisplay();
    };
    filtersContainer.appendChild(btn);
  });

  genres.forEach(g => {
    const btn = document.createElement("button");
    btn.textContent = g;
    btn.classList.add("genre-btn");
    if (g === currentGenre) btn.classList.add("active");
    btn.onclick = () => {
      currentGenre = g;
      document.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndDisplay();
    };
    filtersContainer.appendChild(btn);
  });
}

function filterAndDisplay() {
  const q = searchInput.value.toLowerCase();
  const filtered = movies.filter(m =>
    (currentLang==="All" || m.language===currentLang) &&
    (currentGenre==="All" || m.genre.split("-").includes(currentGenre)) &&
    m.title.toLowerCase().includes(q)
  );
  filteredMovies = filtered;
  if(filtered.length === 0) {
    alert("No Result Found")
    seeMoreBtn.style.display = "none";
  } else {
    displayMovies(filtered.slice(0, displayCount));
    seeMoreBtn.style.display = filtered.length>displayCount ? "block":"none";
  }
}

function formatGenre(genre){ return genre ? genre.split("-").map(g=>g.trim()).filter(Boolean).join(" / ") : ""; }
function searchMovie(){ filterAndDisplay(); }
function seeMore(){
  displayCount += 8;
  displayMovies(filteredMovies.slice(0, displayCount));
  if(displayCount>=filteredMovies.length) seeMoreBtn.style.display="none";
}

// ================= DISPLAY MOVIES =================
function displayMovies(list) {
  moviesContainer.innerHTML = list.map(m => `
  <div class="col-md-3">
   <div class="movie-card" onclick="openMovieDetails(${m.id})" style="cursor:pointer;">
   <img src="${m.image}" onclick="openMovieDetails(${m.id}); event.stopPropagation();">
   <div class="movie-card-body">
      <h6>${m.title}</h6>
      <p>${m.language} | ${m.genre.replaceAll("-", " / ")}</p>
      <div class="d-flex gap-2">
        <button class="btn btn-primary flex-fill" onclick="openBooking(${m.id}); event.stopPropagation();">Book Now</button>
        <button class="btn btn-warning flex-fill fav-btn" onclick="addFavorite(${m.id}); event.stopPropagation();">❤️ Favorite</button>
      </div>
    </div>
    </div>
  </div>`).join("");
}

// ================= FAVORITES =================
function addFavorite(id){
  if(!userLoggedIn){ alert("Login first"); return; }
  let m = movies.find(x=>x.id===id) || upcomingMovies.find(x=>x.id===id);
  if(!favoriteMovies.includes(m.title)) favoriteMovies.push(m.title);

  localStorage.setItem(`fav_${currentUser.email}`, JSON.stringify(favoriteMovies));
  renderSidebar();
}

// ================= SIDEBAR =================
function renderSidebar(){
  favList.innerHTML = favoriteMovies.length ? favoriteMovies.map(f=>`<li>${f}</li>`).join("") : "<li>No favorites</li>";
  historyList.innerHTML = bookedHistory.length 
    ? bookedHistory.map(b=>`<li>
        ${b.title} (${b.seatNumbers.join(", ")}) <br>
        ${b.date} at ${b.time} <br>
        ₹${b.price}
      </li>`).join("") 
    : "<li>No bookings</li>";
}

function openSidebar(){
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.add("active");
    renderSidebar();
}

function closeSidebar(){
    document.getElementById("sidebar").classList.remove("active");
}


// OPEN ONLY ONE SECTION
function toggleSection(id){

    document.querySelectorAll(".section-content").forEach(el=>{
        if(el.id !== id){
            el.classList.remove("active");
        }
    });

    document.getElementById(id).classList.toggle("active");
}

// function closeSidebar(){ document.getElementById("sidebar").style.left="-300px"; }

// ================= BOOKING =================
function closeBooking(){ bookingModal.style.display="none"; }

function updatePrice(){ 
  totalPrice.innerText = selectedSeats.length * selectedMovie.price;
  document.getElementById("payBtn").disabled = selectedSeats.length === 0;
}

function handlePaymentChange(){ 
  cardDetails.style.display="none"; 
  upiDetails.style.display="none"; 
  if(paymentMethod.value==="card") cardDetails.style.display="block"; 
  if(paymentMethod.value==="upi") upiDetails.style.display="block"; 
}

// ================= FAKE PAYMENT PROCESS =================
function processPayment() {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(true); }, 1500);
  });
}
async function confirmBooking(){

  if(!userLoggedIn){ alert("Please login first"); return; }
  if(!selectedTime){ alert("Select show time"); return; }
  if(selectedSeats.length===0){ alert("Select at least one seat"); return; }
  if(paymentMethod.value===""){ alert("Select payment method"); return; }

  alert("Processing payment...");

  const paymentSuccess = await processPayment();

  if(!paymentSuccess){
    alert("Payment failed");
    return;
  }

  const bookingObj={
    title:selectedMovie.title,
    image:selectedMovie.image,
    date:bookingDate.value,
    time:selectedTime,
    seatNumbers:[...selectedSeats],
    price:selectedSeats.length * selectedMovie.price,
    payment:paymentMethod.value
  };

  // SAVE HISTORY
  bookedHistory.push(bookingObj);

  localStorage.setItem(`history_${currentUser.email}`, JSON.stringify(bookedHistory));

  alert("🎉 Booking Confirmed!");

  // SHOW PROFESSIONAL TICKET
  setTimeout(()=>{
     showTicketAlert(bookingObj);
  },100);

  closeBooking();
  renderSidebar();
}

function showTicketAlert(data){

 const overlay=document.getElementById("ticketOverlay");
 const container=document.getElementById("ticketContainer");

 overlay.style.display="block";

 container.innerHTML=`

  <div class="ticket-box">

    <img src="${data.image}" class="ticket-img">

    <div class="ticket-body">

      <div class="ticket-title">${data.title}</div>

      <div class="ticket-row">
        <span>Date</span>
        <span>${data.date}</span>
      </div>

      <div class="ticket-row">
        <span>Time</span>
        <span>${data.time}</span>
      </div>

      <div class="ticket-row">
        <span>Seats</span>
        <span>${data.seatNumbers.join(", ")}</span>
      </div>

      <div class="ticket-row">
        <span>Payment</span>
        <span>${data.payment}</span>
      </div>

      <div class="ticket-price">
        Total ₹${data.price}
      </div>

      <button class="ticket-close" onclick="closeTicket()">
        CLOSE
      </button>
    </div>
  </div>
 `;

 setTimeout(()=>{
   container.style.top="60px";
 },50);
}

function closeTicket(){
 document.getElementById("ticketOverlay").style.display="none";
 const container=document.getElementById("ticketContainer");
 container.style.top="-600px";
 setTimeout(()=>{
   container.innerHTML="";
 },400);
}
function toggleSection(id){
    document.querySelectorAll(".section-content").forEach(el=>{
        if(el.id !== id){
            el.classList.remove("active");
        }
    });
    document.getElementById(id).classList.toggle("active");

}

// ================= VALIDATION =================
function nameValidation(){ 
  const name=loginName.value; 
  const namepatt=/^[A-Za-z ]+$/; 
  if(name===""){ alert("Name is required"); return false; } 
  else if(!namepatt.test(name)){ alert("Name must contain only letters"); return false; } 
  return true; 
}

function emailValidation(){ 
  const email=loginEmail.value; 
  const emailpatt=/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/; 
  if(email===""){ alert("Email is required"); return false; } 
  else if(!emailpatt.test(email)){ alert("Invalid Email"); return false; } 
  return true; 
}

// ================= HOME / UPCOMING =================
function showOnlyUpcoming(){
  moviesContainer.innerHTML=""; filtersContainer.innerHTML=""; seeMoreBtn.style.display="none"; homeBtnContainer.style.display="block";
  moviesContainer.innerHTML = upcomingMovies.map(m=>`
    <div class="col-md-3">
      <div class="movie-card">
        <img src="${m.image}">
        <div class="movie-card-body">
          <h5>${m.title}</h5>
          <p>${m.language} | ${m.genre}</p>
          <button class="btn btn-secondary w-100" disabled>Coming Soon</button>
        </div>
      </div>
    </div>
  `).join("");
}

function showHomeMovies(){
  homeBtnContainer.style.display="none";
  currentLang="All"; currentGenre="All"; displayCount=8;
  moviesContainer.innerHTML=""; filtersContainer.innerHTML="";
  renderFilters(); filterAndDisplay();
}

// ================= INIT =================
window.onload = ()=>{
   const loggedIn = localStorage.getItem("userLoggedIn")==="true";
   const city = localStorage.getItem("selectedCity");
   if(loggedIn && city){
     userLoggedIn=true; 
     currentUser=JSON.parse(localStorage.getItem("currentUser"))||{};
     favoriteMovies = JSON.parse(localStorage.getItem(`fav_${currentUser.email}`)) || [];
     bookedHistory = JSON.parse(localStorage.getItem(`history_${currentUser.email}`)) || [];

     loginBtn.classList.add("d-none"); 
     logoutBtn.classList.remove("d-none"); 
     hamburger.classList.remove("d-none");

     welcomeText.innerText=`Hi, ${currentUser.name}`; 
     userNameText.innerText=currentUser.name;

     cityModal.style.display="none";
     renderFilters(); filterAndDisplay(); 
     return;
   }
   cityModal.style.display="block";
};

// ================= MOVIE DETAILS =================
function openMovieDetails(id){
  const movie = movies.find(m => m.id===id) || upcomingMovies.find(m => m.id===id);
  if(!movie) return;
  selectedMovie = movie;

  const poster = document.getElementById("detailsPoster");
  poster.src = movie.image;
  poster.style.display = "block";
  document.getElementById("detailsTitle").innerText = movie.title;
  document.getElementById("detailsGenre").innerText = movie.genre ? movie.genre.replaceAll("-", " / ") : "N/A";
  document.getElementById("detailsSynopsis").innerText = movie.synopsis || "Synopsis not available";
  document.getElementById("detailsCast").innerText = movie.cast || "TBD";
  document.getElementById("detailsRating").innerText = movie.rating || "4.5";

  document.getElementById("movieDetailsModal").style.display = "flex";
}

function closeMovieDetails(){
  document.getElementById("movieDetailsModal").style.display = "none";
}

// ===== PROFILE MODAL =====
function openProfile(){
  if(!userLoggedIn){ alert("Login first"); return; }
  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileEmail").value = currentUser.email;
  document.getElementById("profileModal").style.display="block";
}

function updateProfile(){
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();

  if(!/^[A-Za-z ]+$/.test(name)){ alert("Invalid name"); return; }
  if(!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/.test(email)){ alert("Invalid email"); return; }

  currentUser.name = name;
  currentUser.email = email;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  welcomeText.innerText = `Hi, ${name}`;
  userNameText.innerText = name;

  // Refresh per-user data after email change
  favoriteMovies = JSON.parse(localStorage.getItem(`fav_${currentUser.email}`)) || [];
  bookedHistory = JSON.parse(localStorage.getItem(`history_${currentUser.email}`)) || [];
  renderSidebar();

  alert("Profile updated!");
  document.getElementById("profileModal").style.display="none";
}

// ================= TRAILER MODAL =================
function playTrailer() {
  if (!selectedMovie || !selectedMovie.trailer) {
    alert("Trailer not available");
    return;
  }

  let url = selectedMovie.trailer;
  if (url.includes("youtube.com/embed/")) {
    const videoId = url.split("/embed/")[1];
    url = "https://www.youtube.com/watch?v=" + videoId;
  }

  window.open(url, "_blank");
}

// ================= ADMIN ADD MOVIE =================
let savedMovies = JSON.parse(localStorage.getItem("movies")) || [];
if(savedMovies.length>0){ movies.length = 0; savedMovies.forEach(m => movies.push(m)); }
function saveMoviesToStorage(){ localStorage.setItem("movies", JSON.stringify(movies)); }
function generateMovieId(){ return movies.length ? Math.max(...movies.map(m=>m.id))+1 : 1; }

function openAddMovieModal(){ document.getElementById("addMovieModal").style.display="flex"; document.getElementById("addMovieForm").reset(); }

function addMovie(){
  const title = document.getElementById("movieTitleInput").value.trim();
  const language = document.getElementById("movieLanguageInput").value.trim();
  const genre = document.getElementById("movieGenreInput").value.trim();
  const price = parseInt(document.getElementById("moviePriceInput").value);
  const times = document.getElementById("movieTimesInput").value.split(",").map(t=>t.trim()).filter(Boolean);
  const image = document.getElementById("movieImageInput").value.trim();
  const trailer = document.getElementById("movieTrailerInput").value.trim();
  const cast = document.getElementById("movieCastInput").value.trim();
  const synopsis = document.getElementById("movieSynopsisInput").value.trim();
  const rating = document.getElementById("movieRatingInput").value.trim();

  if(!title || !language || !genre || !price || times.length===0 || !image){ alert("Fill required fields"); return; }

  const newMovie = { id: generateMovieId(), title, language, genre, price, times, image, trailer, cast, synopsis, rating };
  movies.push(newMovie);
  saveMoviesToStorage();
  alert("Movie added successfully!");
  document.getElementById("addMovieModal").style.display="none";

  displayMovies(filteredMovies.length ? filteredMovies : movies.slice(0, displayCount));
  renderFilters();
}

function deleteMovie(id){
  if(!confirm("Are you sure you want to delete this movie?")) return;
  const index = movies.findIndex(m=>m.id===id);
  if(index>-1){
    movies.splice(index,1);
    saveMoviesToStorage();
    alert("Movie deleted!");
    displayMovies(filteredMovies.length ? filteredMovies : movies.slice(0, displayCount));
    renderFilters();
  }
}

function editMovie(id){
  const movie = movies.find(m=>m.id===id);
  if(!movie) return;

  document.getElementById("movieTitleInput").value = movie.title;
  document.getElementById("movieLanguageInput").value = movie.language;
  document.getElementById("movieGenreInput").value = movie.genre;
  document.getElementById("moviePriceInput").value = movie.price;
  document.getElementById("movieTimesInput").value = movie.times.join(", ");
  document.getElementById("movieImageInput").value = movie.image;
  document.getElementById("movieTrailerInput").value = movie.trailer;
  document.getElementById("movieCastInput").value = movie.cast;
  document.getElementById("movieSynopsisInput").value = movie.synopsis;
  document.getElementById("movieRatingInput").value = movie.rating;

  document.getElementById("addMovieModal").style.display="flex";

  const saveBtn = document.getElementById("saveMovieBtn");
  saveBtn.onclick = function(){
    movie.title = document.getElementById("movieTitleInput").value.trim();
    movie.language = document.getElementById("movieLanguageInput").value.trim();
    movie.genre = document.getElementById("movieGenreInput").value.trim();
    movie.price = parseInt(document.getElementById("moviePriceInput").value);
    movie.times = document.getElementById("movieTimesInput").value.split(",").map(t=>t.trim()).filter(Boolean);
    movie.image = document.getElementById("movieImageInput").value.trim();
    movie.trailer = document.getElementById("movieTrailerInput").value.trim();
    movie.cast = document.getElementById("movieCastInput").value.trim();
    movie.synopsis = document.getElementById("movieSynopsisInput").value.trim();
    movie.rating = document.getElementById("movieRatingInput").value.trim();

    saveMoviesToStorage();
    alert("Movie updated successfully!");
    document.getElementById("addMovieModal").style.display="none";
    displayMovies(filteredMovies.length ? filteredMovies : movies.slice(0, displayCount));
    renderFilters();

    saveBtn.onclick = addMovie;
  };
}


function fixMobileLayout() {

    // Navbar full width
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        navbar.style.width = "100%";
    }

    // Movies grid mobile fix
    if (window.innerWidth <= 768) {

        document.querySelectorAll(".movie-col").forEach(col => {
            col.style.flex = "0 0 100%";
            col.style.maxWidth = "100%";
        });

    } else {

        document.querySelectorAll(".movie-col").forEach(col => {
            col.style.flex = "";
            col.style.maxWidth = "";
        });

    }
}
