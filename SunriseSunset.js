import fetch from "node-fetch";

export async function init () {
    await Avatar.lang.addPluginPak('SunriseSunset');
}

export async function action(data, callback) {

	try {

		const L = await Avatar.lang.getPak('SunriseSunset', data.language);
		
		const tblActions = {
			sunrise: () => leverCoucher("lever", data.client, L),
			sunset: () => leverCoucher("coucher", data.client, L)					
		}
		
		info("SunriseSunset:", data.action.command, "from", data.client);
			
		if (tblActions[data.action.command]) {
			await tblActions[data.action.command]();
		}

	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}	
		
	callback();
 
}

const leverCoucher = async (type, client, L) => {

	try {

		const locRes = await fetch("http://ip-api.com/json/");
		if (!locRes.ok) throw new Error("Impossible de trouver la localisation");

		const loc = await locRes.json();
		const { lat, lon } = loc;

		const sunRes = await fetch(
			`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
		);
		if (!sunRes.ok) throw new Error("Erreur API soleil");

		const sunData = await sunRes.json();

		let heureUTC;

		if (type === "lever") {
			heureUTC = sunData.results.sunrise;
		} else {
			heureUTC = sunData.results.sunset;
		}

		const date = new Date(heureUTC);
		const heureLocale = date.toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit"
		});

		const phrase = type === "lever"
				? L.get(["speech.sunrise", heureLocale])
				: L.get(["speech.sunset", heureLocale])

				info(phrase);

		Avatar.speak(phrase, client, () => Avatar.Speech.end(client));

	} catch (err) {
		error("Sunrise Sunset ERROR:", err.message);
		Avatar.speak(L.get("speech.error"), client, () => {
			Avatar.Speech.end(client);
		});
	}
}

