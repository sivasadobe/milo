import { expect } from '@esm-bundle/chai';
import { readFile, sendKeys, sendMouse } from '@web/test-runner-commands';
import { delay, waitForRemoval } from '../../helpers/waitfor.js';
import { mockFetch, unmockFetch } from './mocks/response/fetch.js';
import './mocks/login-prompt.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const { default: init } = await import('../../../libs/blocks/bulk-publish/bulk-publish.js');

const testPage = 'https://main--milo--adobecom.hlx.page/drafts/sarchibeque/bulk-publish-test';

const setProcess = async (el, type = 'preview') => {
  const select = el.querySelector('#ProcessSelect');
  select.focus();
  await sendKeys({ type });
  select.blur();
};

const setTextArea = async (el, type) => {
  const select = el.querySelector('#Urls');
  select.focus();
  await sendKeys({ type });
  select.blur();
};

const clickElem = async (el) => {
  if (!el) return;
  const rect = el?.getBoundingClientRect();
  await sendMouse({
    type: 'click',
    button: 'left',
    position: [
      parseInt((rect?.left ?? 0) + 1, 10),
      parseInt((rect?.top ?? 0) + 1, 10),
    ],
  });
};

describe('Bulk Publish Tool', () => {
  before(async () => {
    await mockFetch();
  });
  after(() => {
    unmockFetch();
  });

  init(document.querySelector('.bulk-publish'));
  const bulkPub = document.querySelector('bulk-publish');
  const rootEl = bulkPub.shadowRoot;

  it('can render bulk publish tool', () => {
    expect(bulkPub).to.exist;
  });

  it('can prompt user to open sidekick', () => {
    const prompt = rootEl.querySelector('.login-prompt');
    expect(prompt).to.exist;
    expect(prompt.innerText).to.equal('Please open AEM sidekick to continue');
  });

  it('can close sign-in prompt', async () => {
    const sidekick = document.querySelector('helix-sidekick');
    sidekick.opened();
    sidekick.status();
    await waitForRemoval('.login-prompt');
    expect(rootEl.querySelector('.login-prompt')).to.not.exist;
  });

  it('can toggle ui mode', async () => {
    await clickElem(rootEl.querySelector('.switch.half'));
    const pub = rootEl.querySelector('.bulk-publisher');
    expect(pub).to.exist;
  });

  it('can select process type', async () => {
    const process = 'preview';
    await setProcess(rootEl, process);
    expect(rootEl.querySelector('#ProcessSelect').value).to.equal(process);
  });

  it('can validate urls and disable form', async () => {
    await setTextArea(rootEl, 'not_a_url');
    const errors = rootEl.querySelector('.errors');
    expect(errors.querySelector('strong').innerText).to.equal('Invalid Url');
  });

  it('can handle api error response', async () => {
    await setTextArea(rootEl, 'https://error--milo--adobecom.hlx.page/not/a/valid/path');
    await clickElem(rootEl.querySelector('#RunProcess'));
    const errors = rootEl.querySelector('.errors');
    expect(errors.querySelector('strong').innerText).to.equal('Unauthorized');
  });

  it('can validate milo urls and enable form', async () => {
    await setTextArea(rootEl, testPage);
    await delay(200);
    const submitBtn = rootEl.querySelector('#RunProcess');
    expect(submitBtn.getAttribute('disable')).to.equal('false');
  });

  it('can submit valid bulk preview job', async () => {
    await clickElem(rootEl.querySelector('#RunProcess'));
    await delay(1500);
    expect(rootEl.querySelectorAll('job-process')).to.have.lengthOf(1);
  });

  it('can open result page url', async () => {
    await delay(1500);
    const previewProcess = rootEl.querySelector('job-process');
    const previewResult = previewProcess.shadowRoot.querySelector('.result');
    await clickElem(previewResult);
    previewResult.classList.add('opened');
    expect(previewResult.classList.contains('opened')).to.be.true;
  });

  it('can submit valid bulk delete job', async () => {
    await delay(1500);
    await setProcess(rootEl, 'delete');
    await setTextArea(rootEl, testPage);
    await clickElem(rootEl.querySelector('#RunProcess'));
    expect(rootEl.querySelectorAll('job-process')).to.have.lengthOf(2);
  });

  it('can copy result page url', async () => {
    await delay(1500);
    const deleteProcess = rootEl.querySelectorAll('job-process')[1];
    const deleteResult = deleteProcess?.shadowRoot.querySelector('.result');
    await clickElem(deleteResult);
    deleteResult.classList.add('copied');
    expect(deleteResult.classList.contains('copied')).to.be.true;
  });

  it('can submit valid publish job', async () => {
    await delay(1500);
    await setProcess(rootEl, 'publish');
    await setTextArea(rootEl, testPage);
    await clickElem(rootEl.querySelector('#RunProcess'));
    await delay(400);
    expect(rootEl.querySelectorAll('job-process')).to.have.lengthOf(3);
  });

  it('can submit valid index job', async () => {
    await delay(1500);
    await setProcess(rootEl, 'index');
    await setTextArea(rootEl, testPage);
    await clickElem(rootEl.querySelector('#RunProcess'));
    await delay(400);
    expect(rootEl.querySelectorAll('job-process')).to.have.lengthOf(4);
  });
});
