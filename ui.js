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

  // global favorite state
  let isInFavoriteState = false;

  // global skip amount
  let skipAmount = 25

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

    // clear input fields
    $submitForm[0].reset();

    let user = currentUser;
    let storyObj = { author, title, url };

    await storyList.addStory(user, storyObj);
    generateStories();
    skipAmount = 25
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
    skipAmount = 25
    $allStoriesList.show();
    if (currentUser) {
      $submitForm.show();
    };

    //empty input fileds


    //change favorite state to off
    isInFavoriteState = false
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
    skipAmount = 25
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    skipAmount = 25
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

    let deleteButton = ''
    //if user is logged in (curr user not null)
    // else delete button is blank
    if (currentUser !== null) {
      // if story is part of currentUser.ownStories then we can render an the delte button else dont render delete button
      const storyIsNotPartOfUserStories = (currentUser.ownStories.every(s => {
        return s.storyId !== story.storyId
      }))
      if (storyIsNotPartOfUserStories) {
        deleteButton = ''
      } else {
        deleteButton = `<i class="delete-story fas fa-times"></i>`
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
        ${deleteButton}
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    // create array of Id's of current favorites


    return storyMarkup;
  }




  $(".articles-list").on("click", ".fa-star", async function () {

    //if user is not logged in just return from function
    if (currentUser == null) return

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


  $(".articles-list").on("click", ".delete-story", async function () {


    //get storyId that was clicked
    let storyId = $(this).parent().attr('id')

    //call remove method from storylist instance

    await storyList.deleteStory(currentUser, storyId)


    //if we are not in favorites state then 
    //refresh the entire page for all current stories 
    if (!isInFavoriteState) {
      await generateStories();
    } else {
      //render only favorites stories

      // empty out that part of the page
      $allStoriesList.empty();

      // loop through all of our stories and generate HTML for them
      for (let favoriteStory of currentUser.favorites) {
        const result = generateStoryHTML(favoriteStory);
        $allStoriesList.append(result);
      }

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

    isInFavoriteState = true
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

  function renderMoreStories(newStories) {

    // loop through all of our stories and generate HTML for them
    for (let story of newStories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }


  $(document).ready(function () {
    $(window).scroll(async function () {

      var wintop = $(window).scrollTop(), docheight = $(document).height(), winheight = $(window).height();
      var scrolltrigger = 0.95;

      if ((wintop / (docheight - winheight)) > scrolltrigger) {
        console.log('scroll bottom');

        let newStories = await storyList.getMoreStories(skipAmount)
        renderMoreStories(newStories)

        console.log(newStories);

        //increase skip amount by 25
        skipAmount += 25
      }
    });
  });
});


