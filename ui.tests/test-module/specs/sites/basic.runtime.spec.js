/*******************************************************************************
 * Copyright 2023 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
describe("Forms In Sites Runtime Test", () => {
  const pagePath = "content/forms/sites/core-components-it/blank.html";

  let formContainer = null;

  beforeEach(() => {
    cy.previewForm(pagePath).then(p => {
      formContainer = p;
    })
  });

  it("should initialize form container", () => {
    expect(formContainer, "formcontainer is initialized").to.not.be.null;
    expect(formContainer._model.items.length, "model and view elements match").to.equal(Object.keys(formContainer._fields).length);
    cy.get(`.cmp-adaptiveform-textinput`).find(`.cmp-adaptiveform-textinput__questionmark`).click({ multiple: true});
    cy.get(`.cmp-adaptiveform-textinput`).find(`.cmp-adaptiveform-textinput__longdescription`)
    .should('contain.text', 'This is long description');
  })
})