'use client'

/**
 * Solitaire (Klondike)
 * Classic card game - public domain concept
 * Implementation created for Bloc Step Arcade
 */

import { useState, useEffect, useCallback } from 'react'
import { GameProps } from './GameWrapper'

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

type Suit = typeof SUITS[number]
type Value = typeof VALUES[number]

interface Card {
  suit: Suit
  value: Value
  faceUp: boolean
  id: string
}

interface GameState {
  stock: Card[]
  waste: Card[]
  foundations: Card[][]
  tableau: Card[][]
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
}

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#ef4444',
  diamonds: '#ef4444',
  clubs: '#1a1a2e',
  spades: '#1a1a2e',
}

function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, faceUp: false, id: `${suit}-${value}` })
    }
  }
  return deck
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getValueIndex(value: Value): number {
  return VALUES.indexOf(value)
}

function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

function canStackOnTableau(card: Card, target: Card | undefined): boolean {
  if (!target) return card.value === 'K'
  const cardIdx = getValueIndex(card.value)
  const targetIdx = getValueIndex(target.value)
  return cardIdx === targetIdx - 1 && isRed(card.suit) !== isRed(target.suit)
}

function canStackOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.value === 'A'
  const top = foundation[foundation.length - 1]
  return card.suit === top.suit && getValueIndex(card.value) === getValueIndex(top.value) + 1
}

export function Solitaire({ onScore, onGameOver, isPaused }: GameProps) {
  const [game, setGame] = useState<GameState>(() => initGame())
  const [selected, setSelected] = useState<{ pile: string; index: number } | null>(null)
  const [moves, setMoves] = useState(0)

  function initGame(): GameState {
    const deck = shuffle(createDeck())
    const tableau: Card[][] = []
    let cardIndex = 0

    // Deal 7 tableau piles
    for (let i = 0; i < 7; i++) {
      const pile: Card[] = []
      for (let j = 0; j <= i; j++) {
        const card = { ...deck[cardIndex++] }
        card.faceUp = j === i
        pile.push(card)
      }
      tableau.push(pile)
    }

    return {
      stock: deck.slice(cardIndex),
      waste: [],
      foundations: [[], [], [], []],
      tableau,
    }
  }

  const resetGame = useCallback(() => {
    setGame(initGame())
    setSelected(null)
    setMoves(0)
  }, [])

  // Check for win
  useEffect(() => {
    const totalInFoundations = game.foundations.reduce((sum, f) => sum + f.length, 0)
    if (totalInFoundations === 52) {
      onScore(1000 - moves)
      setTimeout(() => onGameOver(), 1500)
    }
  }, [game.foundations, moves, onScore, onGameOver])

  const drawCard = useCallback(() => {
    if (isPaused) return

    setGame(prev => {
      if (prev.stock.length === 0) {
        // Flip waste back to stock
        return {
          ...prev,
          stock: prev.waste.map(c => ({ ...c, faceUp: false })).reverse(),
          waste: [],
        }
      }

      const card = { ...prev.stock[prev.stock.length - 1], faceUp: true }
      return {
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, card],
      }
    })
  }, [isPaused])

  const handleCardClick = useCallback((pile: string, index: number) => {
    if (isPaused) return

    const pileType = pile.split('-')[0]
    const pileIndex = parseInt(pile.split('-')[1] || '0')

    // If clicking on stock, draw
    if (pile === 'stock') {
      drawCard()
      return
    }

    // Get clicked card
    let clickedCard: Card | undefined
    let clickedCards: Card[] = []

    if (pile === 'waste' && game.waste.length > 0) {
      clickedCard = game.waste[game.waste.length - 1]
      clickedCards = [clickedCard]
    } else if (pileType === 'tableau') {
      const tableau = game.tableau[pileIndex]
      if (index >= 0 && index < tableau.length && tableau[index].faceUp) {
        clickedCard = tableau[index]
        clickedCards = tableau.slice(index)
      }
    } else if (pileType === 'foundation') {
      const foundation = game.foundations[pileIndex]
      if (foundation.length > 0) {
        clickedCard = foundation[foundation.length - 1]
        clickedCards = [clickedCard]
      }
    }

    if (!clickedCard) return

    // If no selection, select this card
    if (!selected) {
      setSelected({ pile, index })
      return
    }

    // If clicking same card, try auto-move to foundation
    if (selected.pile === pile && selected.index === index) {
      // Try to move to foundation
      const selectedPileType = selected.pile.split('-')[0]
      const selectedPileIndex = parseInt(selected.pile.split('-')[1] || '0')

      let cardToMove: Card | undefined

      if (selected.pile === 'waste' && game.waste.length > 0) {
        cardToMove = game.waste[game.waste.length - 1]
      } else if (selectedPileType === 'tableau') {
        const tableau = game.tableau[selectedPileIndex]
        if (selected.index === tableau.length - 1) {
          cardToMove = tableau[selected.index]
        }
      }

      if (cardToMove) {
        for (let i = 0; i < 4; i++) {
          if (canStackOnFoundation(cardToMove, game.foundations[i])) {
            moveCard(selected.pile, `foundation-${i}`)
            return
          }
        }
      }

      setSelected(null)
      return
    }

    // Try to move selected to clicked location
    moveCard(selected.pile, pile)
  }, [isPaused, selected, game, drawCard])

  const moveCard = useCallback((fromPile: string, toPile: string) => {
    const fromType = fromPile.split('-')[0]
    const fromIndex = parseInt(fromPile.split('-')[1] || '0')
    const toType = toPile.split('-')[0]
    const toIndex = parseInt(toPile.split('-')[1] || '0')

    setGame(prev => {
      const newGame = {
        ...prev,
        waste: [...prev.waste],
        foundations: prev.foundations.map(f => [...f]),
        tableau: prev.tableau.map(t => [...t]),
      }

      let cardsToMove: Card[] = []

      // Get cards from source
      if (fromPile === 'waste' && prev.waste.length > 0) {
        cardsToMove = [prev.waste[prev.waste.length - 1]]
        newGame.waste = prev.waste.slice(0, -1)
      } else if (fromType === 'tableau') {
        const sourceIndex = selected?.index ?? 0
        cardsToMove = prev.tableau[fromIndex].slice(sourceIndex)
        newGame.tableau[fromIndex] = prev.tableau[fromIndex].slice(0, sourceIndex)
        // Flip the new top card
        if (newGame.tableau[fromIndex].length > 0) {
          const lastCard = newGame.tableau[fromIndex][newGame.tableau[fromIndex].length - 1]
          if (!lastCard.faceUp) {
            newGame.tableau[fromIndex][newGame.tableau[fromIndex].length - 1] = { ...lastCard, faceUp: true }
          }
        }
      } else if (fromType === 'foundation') {
        const foundation = prev.foundations[fromIndex]
        if (foundation.length > 0) {
          cardsToMove = [foundation[foundation.length - 1]]
          newGame.foundations[fromIndex] = foundation.slice(0, -1)
        }
      }

      if (cardsToMove.length === 0) return prev

      // Try to place cards
      if (toType === 'foundation' && cardsToMove.length === 1) {
        if (canStackOnFoundation(cardsToMove[0], prev.foundations[toIndex])) {
          newGame.foundations[toIndex] = [...newGame.foundations[toIndex], cardsToMove[0]]
          setMoves(m => m + 1)
          onScore(10)
          setSelected(null)
          return newGame
        }
      } else if (toType === 'tableau') {
        const targetPile = prev.tableau[toIndex]
        const topCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined
        if (canStackOnTableau(cardsToMove[0], topCard)) {
          newGame.tableau[toIndex] = [...newGame.tableau[toIndex], ...cardsToMove]
          setMoves(m => m + 1)
          setSelected(null)
          return newGame
        }
      }

      // Move failed, restore
      setSelected(null)
      return prev
    })
  }, [selected, onScore])

  const renderCard = (card: Card | undefined, pile: string, index: number, isFaceUp: boolean = true) => {
    const isSelected = selected?.pile === pile && selected?.index === index

    if (!card) {
      return (
        <div
          key={`empty-${pile}`}
          onClick={() => pile === 'stock' && drawCard()}
          className={`w-12 h-16 rounded border-2 border-dashed border-zinc-600 ${pile === 'stock' ? 'cursor-pointer' : ''}`}
        />
      )
    }

    if (!card.faceUp) {
      return (
        <div
          key={card.id}
          className="w-12 h-16 rounded bg-gradient-to-br from-indigo-600 to-purple-700 border border-zinc-500"
        />
      )
    }

    return (
      <div
        key={card.id}
        onClick={() => handleCardClick(pile, index)}
        style={{
          color: SUIT_COLORS[card.suit],
        }}
        className={`w-12 h-16 rounded bg-white border-2 cursor-pointer flex flex-col items-center justify-center text-sm font-bold select-none
          ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-zinc-300'}
          hover:border-zinc-400`}
      >
        <span>{card.value}</span>
        <span className="text-lg">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    )
  }

  return (
    <div className="text-center">
      {/* Top row: Stock, Waste, Foundations */}
      <div className="flex justify-center gap-2 mb-4">
        {/* Stock */}
        <div onClick={drawCard} className="cursor-pointer">
          {game.stock.length > 0 ? (
            <div className="w-12 h-16 rounded bg-gradient-to-br from-indigo-600 to-purple-700 border border-zinc-500 flex items-center justify-center text-white text-xs">
              {game.stock.length}
            </div>
          ) : (
            <div className="w-12 h-16 rounded border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs">
              Flip
            </div>
          )}
        </div>

        {/* Waste */}
        <div>
          {game.waste.length > 0 ? (
            renderCard(game.waste[game.waste.length - 1], 'waste', game.waste.length - 1)
          ) : (
            <div className="w-12 h-16 rounded border-2 border-dashed border-zinc-700" />
          )}
        </div>

        <div className="w-4" />

        {/* Foundations */}
        {game.foundations.map((foundation, i) => (
          <div key={`foundation-${i}`} onClick={() => handleCardClick(`foundation-${i}`, foundation.length - 1)}>
            {foundation.length > 0 ? (
              renderCard(foundation[foundation.length - 1], `foundation-${i}`, foundation.length - 1)
            ) : (
              <div className="w-12 h-16 rounded border-2 border-dashed border-green-700 flex items-center justify-center text-green-700 text-lg">
                {SUIT_SYMBOLS[SUITS[i]]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tableau - cards cascade downward */}
      <div className="flex justify-center gap-2">
        {game.tableau.map((pile, pileIndex) => (
          <div key={`tableau-${pileIndex}`} className="relative w-12" style={{ minHeight: 200 }}>
            {pile.length === 0 ? (
              <div
                onClick={() => handleCardClick(`tableau-${pileIndex}`, -1)}
                className="w-12 h-16 rounded border-2 border-dashed border-zinc-700 cursor-pointer"
              />
            ) : (
              pile.map((card, cardIndex) => {
                // Calculate vertical offset - face-down cards show less
                const offset = pile.slice(0, cardIndex).reduce((acc, c) => {
                  return acc + (c.faceUp ? 24 : 12)
                }, 0)
                return (
                  <div
                    key={card.id}
                    className="absolute left-0"
                    style={{
                      top: offset,
                      zIndex: cardIndex + 1,
                    }}
                  >
                    {renderCard(card, `tableau-${pileIndex}`, cardIndex)}
                  </div>
                )
              })
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <button onClick={resetGame} className="btn bg-zinc-800 hover:bg-zinc-700 px-4">
          New Game
        </button>
        <span className="text-muted self-center">Moves: {moves}</span>
      </div>

      <p className="text-muted text-sm mt-4">
        Click to select, click again to move. Double-click for auto-foundation.
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Klondike Solitaire - Public Domain
      </p>
    </div>
  )
}

export const SolitaireMeta = {
  id: 'solitaire',
  name: 'Solitaire',
  icon: '\u2660',
  description: 'Classic Klondike card game',
  color: 'from-green-600 to-emerald-700',
  credit: 'Classic Card Game',
  license: 'Public Domain',
}
