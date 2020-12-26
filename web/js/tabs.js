/*!
 * Tabs.js v.1.0.0
 * Copyright John Sardañas
 * Released under the MIT license
 * Date: 04-11-2020
 */

function tabs(parameter){
	const tabTriggers = parameter.children[0], tabContents = parameter.children[1];

	tabTriggers.children[0].firstElementChild.classList.add('active');
	tabContents.children[0].classList.add('active');

	for (let i = 0; i < tabTriggers.children.length; i++) {
		tabTriggers.children[i].firstElementChild.dataset.tab = i;
		tabContents.children[i].dataset.tab = i;

		tabTriggers.children[i].addEventListener('click', e => {
			e.preventDefault();
			for (let j = 0; j < tabContents.children.length; j++) {
				tabContents.children[j].dataset.tab == tabTriggers.children[i].firstElementChild.dataset.tab ? tabContents.children[j].classList.add('active') : tabContents.children[j].classList.remove('active');
				tabTriggers.children[j].firstElementChild.dataset.tab == tabTriggers.children[i].firstElementChild.dataset.tab ? tabTriggers.children[j].firstElementChild.classList.add('active') : tabTriggers.children[j].firstElementChild.classList.remove('active');
			}
		});
	}
}