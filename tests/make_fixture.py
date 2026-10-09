"""Create an original, tiny two-page PDF fixture. No event source is used."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import reportlab
font=Path(reportlab.__file__).parent/'fonts'/'Vera.ttf'
pdfmetrics.registerFont(TTFont('FixtureFont',str(font)))
out=Path(__file__).with_name('generated-fixture.pdf')
c=canvas.Canvas(str(out),pagesize=(400,500))
c.setTitle('Original synthetic test layout')
for index,label in enumerate(['A12','B34']):
 c.setFont('FixtureFont',16);c.drawString(30,460,'Synthetic layout '+str(index+1))
 c.rect(100,220,100,60);c.setFont('FixtureFont',14);c.drawString(130,245,label)
 c.showPage()
c.save();print(out)
