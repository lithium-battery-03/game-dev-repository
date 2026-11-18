# Flappy Chase

A small original browser game inspired by flap-and-dodge games. A rival bird chases from behind, and you must use short speed boosts to shove it backward while threading through pipes.

## Goal

Clear **15 pipes** to win. Hitting a pipe or the ground ends the run, and the chaser catching up also ends the run.

## Run it

Download or clone the repository, then open `index.html` in a modern browser. No install, server, or build step is required.

## Controls

- **Space**, **Up Arrow**, or click/tap the playfield: flap upward.
- **W**: a 2.72-second speed boost that immediately pushes the rival backward, then gradually eases the chase pressure during the boost. The boost has a 2.6-second cooldown after it ends.
- **FLAP** and **BOOST** buttons are available on narrow screens.
- **Enter** or **R**: restart after a round ends.

## The big change

The chase meter rises while flying normally, and its fill rate gradually increases as you clear more pipes. Pressing W shoves the rival backward immediately and continues to push it back during the boost. Time boosts carefully: the rival catches you if the meter reaches 100%.

All visuals use original Canvas shapes; there are no copied characters or game assets.


## Five quick checks

1. Start the round with **Start flying**.
2. Use **Space** or click to flap; check that the bird rises.
3. Press **W** and watch the rival jump backward and the chase meter drop. Wait for the cooldown before boosting again.
4. Win by clearing 15 pipes, or lose by hitting a pipe / ground or allowing the chase meter to reach 100%.
5. Use **Play again / Try again**, or press **Enter**, to restart and confirm the pipe count resets.

## Classmate playtest

Let a classmate try one round without coaching them through the controls. Watch whether they discover Space and W, understand the rival meter, and know how to restart. Ask what felt confusing or unfair, then fix the biggest issue they identify and retest it. Record their actual feedback after the playtest; do not guess or fill it in ahead of time.
