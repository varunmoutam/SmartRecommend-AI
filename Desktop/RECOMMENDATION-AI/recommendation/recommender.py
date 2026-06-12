"""
recommendation/recommender.py
Core recommendation engine using TF-IDF + Cosine Similarity.
Pandas-free: uses Python's built-in csv module.
"""

import os
import csv
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "dataset",
    "courses.csv",
)

DEFAULT_TOP_N = 5


class CourseRecommender:
    """Content-Based Course Recommendation System."""

    def __init__(self, dataset_path: str = DATASET_PATH):
        self.dataset_path = dataset_path
        self.courses = []
        self.tfidf_matrix = None
        self.vectorizer = None
        self._is_ready = False
        self._load_and_build()

    def _load_and_build(self):
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(
                f"Dataset not found at '{self.dataset_path}'."
            )

        with open(self.dataset_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.courses.append({
                    "Course Name":  row.get("Course Name", "").strip(),
                    "Category":     row.get("Category", "").strip(),
                    "Skills":       row.get("Skills", "").strip(),
                    "Description":  row.get("Description", "").strip(),
                })

        if not self.courses:
            raise ValueError("Dataset is empty.")

        feature_strings = [self._build_feature_string(c) for c in self.courses]
        self._build_tfidf_index(feature_strings)
        self._is_ready = True

    @staticmethod
    def _build_feature_string(course: dict) -> str:
        name        = course["Course Name"].lower()
        category    = course["Category"].lower()
        skills      = course["Skills"].lower()
        description = course["Description"].lower()
        return f"{name} {category} {skills} {skills} {description}"

    def _build_tfidf_index(self, feature_strings):
        self.vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            stop_words="english",
            sublinear_tf=True,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(feature_strings)

    @property
    def is_ready(self):
        return self._is_ready

    def get_categories(self):
        seen = set()
        cats = []
        for c in self.courses:
            cat = c["Category"]
            if cat and cat not in seen:
                seen.add(cat)
                cats.append(cat)
        return sorted(cats)

    def get_stats(self):
        if not self._is_ready:
            return {}
        return {
            "total_courses":    len(self.courses),
            "total_categories": len(self.get_categories()),
            "categories":       self.get_categories(),
        }

    def recommend(self, user_query: str, top_n: int = DEFAULT_TOP_N,
                  category_filter: str = None):
        if not self._is_ready:
            raise RuntimeError("Recommender not initialised.")

        query = user_query.strip()
        if not query:
            raise ValueError("Query must not be empty.")

        query_vec = self.vectorizer.transform([query.lower()])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        working_scores = scores.copy()
        if category_filter and category_filter.lower() != "all":
            for i, course in enumerate(self.courses):
                if course["Category"].lower() != category_filter.lower():
                    working_scores[i] = -1

        ranked = np.argsort(working_scores)[::-1]
        top_indices = [i for i in ranked if working_scores[i] >= 0][:top_n]

        results = []
        for idx in top_indices:
            score = float(working_scores[idx])
            match_pct = round(score * 100, 1)
            course = self.courses[idx]
            results.append({
                "course_name":      course["Course Name"],
                "category":         course["Category"],
                "skills":           course["Skills"],
                "description":      course["Description"],
                "match_percentage": match_pct,
            })

        return results


# Singleton
recommender = CourseRecommender()