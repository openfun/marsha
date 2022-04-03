"""Helpers to process markdown text"""

import logging
from subprocess import DEVNULL, call  # nosec
import tempfile


logger = logging.getLogger(__name__)

LATEX_CMD_TIMEOUT = 60  # seconds, allows complex input LaTeX
DVISVGM_CMD_TIMEOUT = 10  # seconds


class LatexConversionException(Exception):
    """Exception possibly raised during the LaTeX conversion process."""


def render_latex_to_image(latex_text: str):
    r"""Generates an SVG representation of a LaTeX string.

    Parameters
    ----------
    latex_text : string
        A string containing the raw LaTeX "code" to render.
        For a basic usage, it may only contain an equation:
        ```
        I = \int \rho R^{2} dV
        ```
        For advanced use it may provide more packages to use:
        ```
        \usepackage{xcolor}
        \usepackage{tikz}
        \usetikzlibrary{positioning,arrows}

        \begin{document}

        \fontsize{5}{6}

        \begin{tikzpicture}[>=stealth,every node/.style={minimum size=1cm},on grid]
        [...]
        \end{tikzpicture}

        \end{document}
        ```
        In such case, the `\begin{document}` and `\end{document}`
        are mandatory.

    Returns
    -------
    string
        A string containing the SVG representation of the LaTeX input


    Exceptions
    ----------

    LatexConversionException
        In case any conversion step fails, an exception is raised.

    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        with tempfile.NamedTemporaryFile(
            dir=tmp_dir, mode="w", encoding="UTF-8", suffix=".tex"
        ) as tmp_file:
            # Provide a default configuration
            # we may adapt it later to allow user to fully customize output
            tmp_file.write("\\documentclass{standalone}\n")
            tmp_file.write("\\usepackage[utf8]{inputenc}\n")
            tmp_file.write("\\usepackage{mathtools}\n")
            tmp_file.write("\\usepackage[usenames,dvipsnames]{color}\n")

            full_document_provided = False
            if "\\begin{document}" in latex_text:
                full_document_provided = True
            else:
                tmp_file.write("\\begin{document}\n")

            # Figure out the mode that we're in
            if full_document_provided:
                tmp_file.write(latex_text)
            else:
                tmp_file.write(f"$\\displaystyle\n{latex_text}\n$")

            if (
                "\\end{document}" not in latex_text
            ):  # may test on full_document_provided
                tmp_file.write("\\end{document}\n")

            # Write down the temporary file
            tmp_file.flush()

            # compile LaTeX document. A DVI file is created
            _compile_latex_file(tmp_dir, tmp_file.name)

            tmp_file_base_name = tmp_file.name.rsplit(".")[0]
            dvi_filename = f"{tmp_file_base_name}.dvi"
            svg_filename = f"{tmp_file_base_name}.svg"

            # Extract the image
            return _dvi_to_svg_base64(dvi_filename, svg_filename)


def _compile_latex_file(working_dir: str, input_file_name: str):
    """Compile the LaTeX file by running a `latex` command line.

    Parameters
    ----------
    working_dir : string
        The directory where generated files will be created.

    input_file_name: string
        The LaTeX input file (ie the `.tex` file)

    Returns
    -------
    None
        This function generates files and returns nothing.
    """

    cmd = [
        "latex",
        "-interaction=batchmode",
        "-halt-on-error",
        f"-output-directory={working_dir}",
        input_file_name,
    ]
    status = call(  # nosec
        cmd,
        stdout=DEVNULL,
        stderr=DEVNULL,
        timeout=LATEX_CMD_TIMEOUT,
    )

    tmp_file_base_name = input_file_name.rsplit(".")[0]
    if status:  # This means we failed
        logger.error("Couldn't compile LaTeX document")
        with open(f"{tmp_file_base_name}.log", "r", encoding="utf-8") as log_file:
            logger.info("LaTeX conversion failure log: %s", log_file.read())
        with open(f"{tmp_file_base_name}.tex", "r", encoding="utf-8") as tex_file:
            logger.info("LaTeX conversion failure input file: %s", tex_file.read())
        raise LatexConversionException("Couldn't compile LaTeX document")


def _dvi_to_svg_base64(input_file: str, output_file: str) -> str:
    """Convert the LaTeX dvi file into an SVG file by
    running an `dvisvgm` command line.

        Parameters
        ----------
        input_file : string
            The DVI file name to convert

        output_file: string
            The output SVG file name

        Returns
        -------
        string
            The content of the output SVG file (ie the XML SVG formatted image).
    """
    command = [
        "dvisvgm",
        input_file,
        "-o",
        output_file,
        "-n",  # = --no-fonts, don't suppose the viewer has all fonts
        "-Z 1.4",  # = --zoom, zoom in by 140%
    ]
    status = call(  # nosec
        command,
        stdout=DEVNULL,
        stderr=DEVNULL,
        timeout=DVISVGM_CMD_TIMEOUT,
    )

    if status:  # This means we failed
        logger.error("Couldn't convert LaTeX to SVG")
        raise LatexConversionException("Couldn't convert LaTeX to SVG")

    # Read the png and encode the data
    with open(output_file, "rb") as svg_file:
        return svg_file.read().decode("utf-8")
