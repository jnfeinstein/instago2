/** @jsx React.DOM */

function formatTime(seconds) {
  var minutes = Math.floor(seconds / 60);
  var newSeconds = seconds - (minutes * 60);
  var result = '';
  
  if (minutes > 0) {
    result += minutes;
  } else {
    result += "0"
  }
  result += ":";
  if (newSeconds < 10) {
    result += "0";
  }
  return result + newSeconds;
}

var AnswerComponent = React.createClass({
  render: function() {
    return (
      <div className='answer-container'>
        <img src={this.props.src} />
        <div className="radio">
          <input type="radio" name={this.props.name} value={this.props.value} onClick={this.props.answerClicked} />
        </div>
      </div>
    );
  }
});

var QuestionComponent = React.createClass({
  getInitialState: function() {
    return {
      answers: _.shuffle(this.props.images),
      selectedAnswerIndex: null
    };
  },
  componentDidMount: function() {
    $(window).off('keypress');
    this.bindEnterKey();
  },
  render: function() {
    var self = this;
    var answers = _.map(this.state.answers, function(answer, i) {
      return (
        <AnswerComponent key={answer} src={answer} name={self.props.title} value={i} answerClicked={self.answerClicked} />
      );
    });

    return (
      <div className="question-container">
        <div className="title">
          <h4>{this.props.title}</h4>
        </div>
        <div className="answers">
          {answers}
        </div>
        <div className="controls">
          <a href="javascript:void(0);" className="btn btn-primary btn-sm submit" onClick={this.submitClicked}>Submit</a>
        </div>
      </div>
    );
  },
  answerClicked: function(e) {
    this.setState({selectedAnswerIndex: $(e.target).val()});
  },
  submitClicked: function() {
    if (!this.state.selectedAnswerIndex) {
      alert("You must select an answer for this question before continuing");
    } else {
      this.props.submitClicked({
        title: this.props.title,
        choice: this.state.answers[this.state.selectedAnswerIndex],
        correct: this.props.images[0]
      });
    }
  },
  bindEnterKey: function() {
    var self = this;
    $(window).on('keypress',function (event){
      if (event.keyCode === 13){
        self.submitClicked();
      }
    });
  }
});

var InterfaceComponent = React.createClass({
  getInitialState: function() {
    return {
      questions: null,
      answers: null,
      answes: null,
      loading: true,
      started: false,
      finished: false,
      timer: null,
      time: 0
    };
  },
  componentDidMount: function() {
    var self = this;
    loadQuestions().done(function(questions) {
      var answers = [];
      var questionComponents = _.map(questions, function(images, title) {
        return (
          <QuestionComponent key={title} title={title} images={images} submitClicked={self.submitClicked}/>
        );
      });

      var shuffledQuestions = _.shuffle(questionComponents)
      self.setState({loading: false, questions: shuffledQuestions, currentQuestion: 0, answers: []});

      // Load images in the order that they are needed
      _.each(shuffledQuestions, function(question) {
        loadImages(question.props.images);
      });
    });
  },
  render: function() {
    if (this.state.loading) {
      return (
        <div>Loading...</div>
      );
    }

    if (!this.state.started) {
      return (
        <div className="start-container">
          <a href="javascript:void(0);" className="btn btn-primary btn-sm" onClick={this.started}>Start Quiz</a>
        </div>
      );
    }

    if (this.state.finished) {
      return (
        <div>Finished!</div>
      );
    }

    return (
      <div className="main-container">
        <div className="time-container">
          <h4>{formatTime(this.state.time)}</h4>
          <h4>{this.state.currentQuestion + 1}/{this.state.questions.length}</h4>
        </div>
        <div style={{clear: 'both'}}></div>
        <div className="currentQuestion">
          {this.state.questions[this.state.currentQuestion]}
        </div>
      </div>
    );
  },
  submitClicked: function(answer) {
    this.state.answers.push(answer);

    var nextQuestion = this.state.currentQuestion + 1;
    if (nextQuestion >= this.state.questions.length) {
      this.finished();
    } else {
      this.setState({currentQuestion: nextQuestion});
    }
  },
  startTimer: function() {
    var self = this;
    var timer = setInterval(function() {
      var newTime = self.state.time + 1;
      if (newTime == 120) {
        alert("Time is up");
        self.finished();
      } else {
        self.setState({time: newTime});
      }
    }, 1000);
    this.setState({timer: timer, time: 0});
  },
  started: function() {
    this.startTimer();
    this.setState({started: true});
  },
  finished: function() {
    clearInterval(this.state.timer);
    this.setState({finished: true, timer: null});
    var numCorrect = _.filter(this.state.answers, function(answer) {
      return answer.correct == answer.choice;
    }).length;
    $.postJSON("/answers", {answers: this.state.answers, numQuestions: this.state.questions.length, numCorrect: numCorrect});
  }
});

function loadQuestions() {
  return $.getJSON("/json/zquestions.json");
}

function loadImages(srcs) {
  _.each(srcs, function(src) {
    $("<img/>", {src: src}); // This will cause the browser to load and cache the images
  });
}

$(function() {
  React.renderComponent(
    <InterfaceComponent />,
    document.getElementById('example')
  );
});