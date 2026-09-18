"""Temporary diagnostic notes only; this file is not imported by the game.
The native XR fixture uses a session clock separate from window.requestAnimationFrame.
Xbox test pulses must wait for NeighborhoodController.polls, not solely XR frames.
The production controller, simulation time and game state are not modified.
"""
