import { SentimentAnalyzer, PorterStemmer, WordTokenizer } from 'natural'
import compromise from 'compromise'
import { positiveThings } from '../variables'
import { Module } from '../interfaces/module'
import { updateSocialCreditScore } from './socialCreditScore'
import 'colorts/lib/string'
import { sendMessage } from './messageSender'

const tokenizer = new WordTokenizer()
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn')
export const positivityEncourager: Module = {
  onMessage: async (msg) => {
    if (!(await isSentenceAboutPositiveThing(msg.content))) return
    let amountOfPositivity = getAmountOfPositivity(msg.content)
    let socialCreditChange = Math.round(
      (amountOfPositivity * 40 - 10) * (Math.random() + 1)
    )
    if (amountOfPositivity > 0) {
      console.log(
        `[${
          'POSITIVITY'.green
        }] Positive message detected (${amountOfPositivity})`
      )
      sendMessage(msg.channel, `好公民! +${socialCreditChange}社会信用`)
    } else {
      console.log(
        `[${
          'POSITIVITY'.green
        }] Negative message detected (${amountOfPositivity})`
      )
      sendMessage(msg.channel, `坏公民! ${socialCreditChange}个社会信用`)
    }
    await updateSocialCreditScore(
      parseInt(msg.author.id),
      socialCreditChange,
      `[POSITIVITY] ${
        socialCreditChange < 0 ? '你对一件好事说了些坏话' : '好公民'
      }`
    )
  },
  startup: () => console.log(`[${'POSITIVITY'.green}] Initialized positivity!`),
}

export const getAmountOfPositivity = (sentence: string) =>
  analyzer.getSentiment(tokenizer.tokenize(sentence))

const isSentenceAboutPositiveThing = (sentence: string) => {
  return new Promise((resolve, _reject) => {
    const sentenceCompromise = compromise(sentence)
    sentenceCompromise.nouns().forEach((noun) => {
      let positiveThing = positiveThings.find((thing) =>
        noun.text().toLocaleLowerCase().includes(thing)
      )
      if (positiveThing) resolve(true)
    })
    resolve(false)
  })
}
