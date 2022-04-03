"""Tests for the ``markdown`` app of the Marsha project."""

import os

from django.test import TestCase

from marsha.markdown.utils.converter import (
    LatexConversionException,
    render_latex_to_image,
)


def get_resource_filename(local_filename):
    """Helper to get absolute file path from this test module."""
    return os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "resources", local_filename
    )


class UtilsConverterTest(TestCase):
    """Tests for the converter module of markdown application."""

    maxDiff = None

    def assertSvgEquals(self, svg_1, svg_2):
        """Specific helper to compare outputs of dvisvgm.

        This ignores two heading lines (xml header and dvisvgm version).
        """
        deconstructed_svg_1 = sorted(svg_1.split("\n")[2:])
        deconstructed_svg_2 = sorted(svg_2.split("\n")[2:])
        self.assertListEqual(deconstructed_svg_1, deconstructed_svg_2)

    def test_base(self):
        """Simple equation should be properly rendered."""
        output_filename = get_resource_filename("rendered_simple_latex.svg")
        with open(output_filename, "r", encoding="utf-8") as expected_output:
            self.assertSvgEquals(
                render_latex_to_image(r"I = \int \rho R^{2} dV"), expected_output.read()
            )

    def test_complex_latex_document(self):
        """Complex docuement should be properly rendered."""
        input_filename = get_resource_filename("latex_complex_scheme.tex")
        output_filename = get_resource_filename("rendered_latex_complex_scheme.svg")
        with open(input_filename, "r", encoding="utf-8") as input_latex:
            with open(output_filename, "r", encoding="utf-8") as expected_output:
                self.assertSvgEquals(
                    render_latex_to_image(input_latex.read()), expected_output.read()
                )

    def test_failing_rendering(self):
        """Wrong LaTeX syntax should fail with proper exception."""
        with self.assertRaisesMessage(
            LatexConversionException, "Couldn't compile LaTeX document"
        ):
            render_latex_to_image(r"invalid $ LaTeX")
