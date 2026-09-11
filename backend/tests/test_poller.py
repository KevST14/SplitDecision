from app.poller import detect_swings


def test_no_swing_below_threshold():
    swings = detect_swings(["Yes", "No"], [0.50, 0.50], [0.53, 0.47], threshold=0.05)
    assert swings == []


def test_swing_at_or_above_threshold():
    swings = detect_swings(["Yes", "No"], [0.50, 0.50], [0.56, 0.44], threshold=0.05)
    assert swings == [("Yes", 0.50, 0.56), ("No", 0.50, 0.44)]


def test_swing_direction_can_be_negative():
    swings = detect_swings(["Yes", "No"], [0.80, 0.20], [0.70, 0.30], threshold=0.05)
    assert swings == [("Yes", 0.80, 0.70), ("No", 0.20, 0.30)]


def test_mismatched_lengths_are_skipped_not_errored():
    swings = detect_swings(["Yes", "No", "Maybe"], [0.5, 0.5], [0.9, 0.1, 0.99], threshold=0.05)
    assert swings == [("Yes", 0.5, 0.9), ("No", 0.5, 0.1)]
