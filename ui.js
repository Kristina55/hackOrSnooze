$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $favoriteStory = $("#favorite-stories")

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    await loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    await loginAndSubmitForm();
  });

  /**
   * Event listener for submitting a story
   *  If success we will append story to DOM
   */

  {/* <label for="author">author</label>
        <input id="author" required type="text" placeholder="author name">
      </div>
      <div>
        <label for="title">title</label>
        <input id="title" required type="text" placeholder="article title">
      </div>
      <div>
        <label for="url">url</label>
        <input id="url" required type="url" placeholder="article url">
      </div> */}


  // {
  //   this.author = storyObj.author;
  //   this.title = storyObj.title;
  //   this.url = storyObj.url;
  //   this.username = storyObj.username;
  //   this.storyId = storyObj.storyId;
  //   this.createdAt = storyObj.createdAt;
  //   this.updatedAt = storyObj.updatedAt;
  // }

  $submitForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let author = $("#author").val();
    let title = $("#title").val();
    let url = $("#url").val();

    let user = currentUser;
    let storyObj = { author, title, url };

    await storyList.addStory(user, storyObj);
    generateStories();
  });

  /**
   * Log Out Functionality
   */
  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */
  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */
  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
    if (currentUser) {
      $submitForm.show();
    };
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */
  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();

    }

  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  async function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();

    //update story
    await generateStories();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    let classOfStar;

    //if currentUser is null (not logged in)
    //then set classOfStar to empty star

    if (currentUser === null) {
      classOfStar = 'far fa-star'

      //else see if story is in favorite list
    } else {
      let favoriteId = (currentUser.favorites.map(function (obj) {
        let arrayofstoryID = obj.storyId;
        return arrayofstoryID;
      }))

      //check to see if the current Id is in the array
      // we want change the class to be the dark star

      if (favoriteId.includes(story.storyId)) {
        classOfStar = "fas fa-star";
      } else {
        classOfStar = "far fa-star";
      }
    }

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}"><span class="list-star"><i class="${classOfStar}"></i></span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    // create array of Id's of current favorites


    return storyMarkup;
  }




  $(".articles-list").on("click", ".fa-star", async function () {

    let className = $(this).attr("class") === "far fa-star" ? "fas fa-star" : "far fa-star";
    // console.log(className)
    $(this).attr("class", className)

    //console.log($(this).parent().parent().attr('id'))

    let storyId = $(this).parent().parent().attr('id')
    // 'fas fa-star' (dark star)
    if (className === 'fas fa-star') {
      currentUser.faveStory(storyId)
    } else {
      await currentUser.unFavoriteStory(storyId)
    }
  })





  $("#favorite-stories").on("click", function () {
    console.log(currentUser.favorites)
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let favoriteStory of currentUser.favorites) {
      const result = generateStoryHTML(favoriteStory);
      $allStoriesList.append(result);
    }
  })




  // hide all elements in elementsArr
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }



  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $submitForm.show();
    $favoriteStory.show();
  }

  // simple function to pull the hostname from a URL
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  // sync current user information to localStorage
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
