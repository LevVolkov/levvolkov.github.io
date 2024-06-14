const myTags = [,
    'JavaScript', 'CSS', 'HTML',
    'Docker', 'Postman', 'DBeaver',
    'Selenium', 'Java', 'git',
    'DevTools', 'PostgreSQL', 'Maven',
    'Gradle', 'MySQL', 'JUnit', 
    'InteliJ IDEA', 'Selenide', 'VSCode'];
    
    var tagCloud = TagCloud('.content', myTags, {
    
      // radius in px 320
      radius: 400,
    
      // animation speed
      // slow, normal, fast
      maxSpeed: 'fast',
      initSpeed: 'fast',
    
      // 0 = top
      // 90 = left
      // 135 = right-bottom
      direction: 135,
    
      // interact with cursor move on mouse out
      keep: true });
    
    //To change the color of text randomly 
    //var colors = ['#34A853', '#FBBC05', '#4285F4', '#7FBC00', '#FFBA01', '#01A6F0',];
    var colors = ['#2F4F4F'];
    var random_color = colors[Math.floor(Math.random() * colors.length)];
    document.querySelector('.content').style.color = random_color;
   
