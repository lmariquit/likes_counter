import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux';
import { addLog, initializeLogs } from '../store/logs'
import { toggleTimer } from '../store/timer'

let speechTime = new Date().toString()
let countDownDate
let errorTimeout
let pause
let convertInterval = 0
let timerInterval = 0
let resetTimeout = 0
let likes = 0

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const speechRecognizer = new SpeechRecognition()

let finalTranscripts = ''

export class SpeechConvertBox extends Component {
    constructor() {
        super()
        this.state = ({
            speech: '',
            hours: '00',
            minutes: '00',
            seconds: '00',
        })
        this.startConverting = this.startConverting.bind(this)
        this.transcribe = this.transcribe.bind(this)
        this.timeCount = this.timeCount.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    componentDidMount() {
        this.props.initializeLogs()
        likes = 0
    }

    transcribe(event) {
        let interimTranscripts = '\n'
        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript
            transcript.replace("\n", "<br>")
            if (event.results[i].isFinal) {
                finalTranscripts += transcript
            } else {
                interimTranscripts += transcript
            }
        }
        this.setState({
            speech: `${finalTranscripts + interimTranscripts}`
        })
        interimTranscripts = ''
        finalTranscripts = ''

    }

    startConverting() {
        speechRecognizer.continuous = true
        speechRecognizer.interimResults = true
        speechRecognizer.lang = 'en-IN'
        speechRecognizer.onerror = function(event) {
            console.log('Speech recognition error detected: ' + event.error);
          }
        
        try {
            speechRecognizer.start()
        } catch(err){
            console.error('TRYING AGAIN:', err)
            setTimeout(() => {
                if (convertInterval !== 0) errorTimeout = speechRecognizer.start()
            }, 700)
        }

        speechRecognizer.onresult = this.transcribe

        convertInterval = setTimeout(() => {
            let toAdd = 0
            let addDb = false
            if (convertInterval !== 0) {
            speechRecognizer.stop()
            finalTranscripts = ''

            if (this.state.speech.includes('like')) {
                let toAddLike = this.state.speech.split(' ').filter(word => word === 'like' || word === '\nlike' || word === 'like\n').length
                likes = likes + toAddLike
                addDb = true
                toAdd += toAddLike
        }
        
        if (this.state.speech.includes('I mean')) {
            let toAddIMean = 0
            let target = this.state.speech
            do {
                toAddIMean += 1
                target = target.slice(target.search('I mean')+7)
            } while (target.search('I mean') >= 0)
            likes = likes + toAddIMean
            addDb = true
            toAdd += toAddIMean
        }
        
        if (this.state.speech.includes('you know')) {
            let toAddYouKnow = 0
            let target = this.state.speech
            do {
                toAddYouKnow += 1
                target = target.slice(target.search('you know')+8)
            } while (target.search('you know') >= 0)
            likes = likes + toAddYouKnow
            addDb = true
            toAdd += toAddYouKnow
        }
        
            if (addDb === true) {
                this.props.addLog({
                    phrase: this.state.speech,
                    likeCount: toAdd,
                    speechTime
                })
                toAdd = 0
            }

            this.setState({
                speech: '',
            })
            
            resetTimeout = setTimeout(() => {
                convertInterval !== 0 && this.startConverting()
                this.setState({
                    speech: '',
                })
            }, 200)
        }
        }, 7000)
        timerInterval = setInterval(()=>this.timeCount(countDownDate), 100);
    }


    timeCount(countDownDate) {
        let now = new Date().getTime();
        let distance = now - countDownDate.getTime();

        let h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let hours = h < 10 ? `0${h}` : h

        let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let minutes = m < 10 ? `0${m}` : m

        let s = Math.floor((distance % (1000 * 60)) / 1000);
        let seconds = s < 10 ? `0${s}` : s

        this.setState({
            hours,
            minutes,
            seconds
        })
    }

    toggle() {
        if (!convertInterval) {
            this.props.toggleTimer()
        } else {
            setTimeout(() => {
                console.log('you have hit STOP')
                this.setState({
                    speech: ''
                })
                this.props.toggleTimer()
                convertInterval = 0
                clearTimeout(convertInterval)
                timerInterval = 0
                clearTimeout(timerInterval)
                resetTimeout = 0
                clearTimeout(resetTimeout)
                clearTimeout(errorTimeout)
                speechRecognizer.stop()
                pause = new Date()
                this.setState({
                    speech: ''
                })
            }, 800)
        }
    }
    
    render() {
        const { hours, minutes, seconds } = this.state
        if(this.props.timer && this.state.hours === '00' && this.state.minutes === '00' && this.state.seconds === '00') {
            countDownDate = new Date()
            this.props.toggleTimer()
            this.startConverting()
        }

        this.props.logs.length && (
            likes = this.props.logs.reduce((acc, elem) => {
                return acc + elem.likeCount
            }, 0)
        )

        return (
            <Fragment>
                {/* <div id="theeeeTitle">FillerKiller</div> */}
                <h2 className="ui header">
                    <i class="cloud icon"></i>
                    <div className="content">
                        FluffTrainer
                    </div>
                </h2>

                <div id="sideBySide">
                    <div id="time">{hours}:{minutes}:{seconds}</div>
                    <button id="timeButton" className="ui green button" onClick={this.toggle}>START<i id="micIcon" className="microphone icon"></i></button>
                </div>
                <div id="sideBySide">
                    <div id="likeLabel">Fluff Words Used: </div>
                    <div id="likesCount" className="ui red circular label">{likes}</div>
                </div>
                <div id="width" className="ui floating message">
                    <div className="text-box" contentEditable="true" suppressContentEditableWarning={true}>{this.state.speech}</div>
                </div>
                {/* <audio className="sound" src="beep.mp3"></audio> */}                
            </Fragment>
        )
    }

}

const mapStateToProps = state => ({
    timer: state.timer,
    logs: state.logs
})

const mapDispatchToProps = dispatch => ({
    addLog: obj => dispatch(addLog(obj)),
    toggleTimer: () => dispatch(toggleTimer()),
    initializeLogs: () => dispatch(initializeLogs())
})

export default connect(mapStateToProps, mapDispatchToProps)(SpeechConvertBox)