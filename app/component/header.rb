module Component

class Header < Lissio::Component
	on :click, '.title, .subtitle' do
		Shekels.navigate '/'
	end

	element '#header'

	html do
		div.title "MUH SHEKELS"
		div.subtitle "השקלים שלי"
	end

	css do
		rule '#header' do
			cursor :default

			margin top: 20.px,
			       bottom: 20.px

			rule '.title' do
				font size: 60.px
			end

			rule '.subtitle' do
				font size: 24.px
			end
		end
	end
end

end
