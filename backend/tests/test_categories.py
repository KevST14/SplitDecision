import pytest

from app.categories import tag_id_for


def test_trending_has_no_tag_filter():
    assert tag_id_for("trending") is None


def test_none_category_means_no_filter():
    assert tag_id_for(None) is None


def test_known_category_returns_its_tag_id():
    assert tag_id_for("crypto") == 21


def test_unknown_category_raises():
    with pytest.raises(ValueError):
        tag_id_for("not-a-real-category")
