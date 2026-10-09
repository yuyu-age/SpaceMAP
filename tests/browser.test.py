"""Mobile Chromium regression check. Start the static server first.
Requires Python playwright, Chromium and the synthetic make_fixture.py PDF.
Run: python3 tests/browser.test.py [http://127.0.0.1:8080/]
"""
import json,shutil,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8080/')
 page.locator('#pdf-file').set_input_files(str(Path(__file__).with_name('generated-fixture.pdf')))
 page.wait_for_function("!document.querySelector('#add').disabled")
 page.wait_for_function("document.querySelector('#offline-status').textContent==='オフライン準備完了'")
 page.locator('#zoom-in').click();page.locator('#zoom-in').click();page.locator('#zoom-in').click()
 page.wait_for_function("document.querySelector('#pdf-detail canvas')?.width > parseFloat(document.querySelector('#pdf-detail canvas').style.width)")
 print('PASS: mobile viewport receives fresh high-density PDF crop')
 def add(booth,notes=''):
  page.locator('#add').click();page.locator('#booth').fill(booth);page.locator('#notes').fill(notes)
  page.locator('#form button[type=submit]').click();page.locator('#confirm-bar').wait_for(state='visible')
  assert page.locator('#save').is_enabled(),page.locator('#preview-help').inner_text()
  page.locator('#save').click();page.locator('#confirm-bar').wait_for(state='hidden')
 def marks():return page.locator('.marker').evaluate_all('(els)=>Object.fromEntries(els.map(e=>[e.title.split(" · ")[0],{x:parseFloat(e.style.left),w:parseFloat(e.style.width)}]))')
 add('A12a','午後に受取\n予算800円');a=marks()['A12a'];assert abs(a['w']-12.5)<.3
 add('A12b');b=marks()['A12b'];assert abs(b['x']-a['x']-a['w'])<.001
 add('A12ab');ab=marks()['A12ab'];assert abs(ab['w']-a['w']*2)<.001
 page.locator('#list-open').click();page.locator('#saved-list .saved-item').filter(has=page.get_by_text('A12a',exact=True)).get_by_role('button',name='編集',exact=True).click()
 assert page.locator('#notes').input_value()=='午後に受取\n予算800円'
 page.locator('#notes').fill('編集した備考');page.locator('#form button[type=submit]').click();page.locator('#confirm-bar').wait_for(state='visible');page.locator('#save').click();page.locator('#confirm-bar').wait_for(state='hidden');assert marks()['A12a']==a
 page.locator('#add').click();page.locator('#booth').fill('C10b');page.locator('#manual-start').click();page.locator('#fit').click()
 for x,y in [(0.2,0.3),(0.4,0.5)]:
  point=page.locator('#surface').evaluate('(e,p)=>{const r=e.getBoundingClientRect();return {x:r.x+r.width*p[0],y:r.y+r.height*p[1]}}',[x,y]);page.touchscreen.tap(point['x'],point['y'])
 assert page.locator('#save').is_enabled();page.locator('#save').click();page.locator('#confirm-bar').wait_for(state='hidden')
 manual=marks()['C10b'];assert abs(manual['x']-30)<.2 and abs(manual['w']-10)<.2
 page.locator('#list-open').click();page.locator('#include-pdf').check()
 with page.expect_download() as download:page.locator('#backup').click()
 path=download.value.path();data=json.loads(Path(path).read_text());assert next(r for r in data['links'] if r['booth']=='A12a')['notes']=='編集した備考'
 page.locator('#close').click();page.locator('#clear-project').click();page.wait_for_function("document.querySelector('#add').disabled")
 page.locator('#restore-file').set_input_files(path);page.wait_for_function("document.querySelector('#count').textContent==='4'")
 page.reload();page.wait_for_function("document.querySelector('#count').textContent==='4'")
 page.locator('#list-open').click();assert page.locator('.saved-notes').inner_text()=='編集した備考';page.locator('#close').click()
 context.set_offline(True);page.reload();page.wait_for_function("document.querySelector('#count').textContent==='4'");page.locator('#zoom-in').click();page.wait_for_selector('#pdf-detail canvas')
 assert not errors,errors
 print('PASS: automatic a/b/ab bounds, manual full-cell split, notes edit, full backup restore, reload and offline high-resolution rendering; no browser errors')
 browser.close()
