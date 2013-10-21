class Shekels < Lissio::Application
	expose :@page

	def initialize
		super

		route '/' do
			@page.go :index
		end

		route '/person/:name' do |params|
			@page.go :person, params[:name]
		end

		route '/item/:name' do |params|
			@page.go :item, params[:name]
		end

		@header = Component::Header.new(self)
		@input  = Component::Input.new(self)
		@page   = Component::Page.new(self)

		on :render do
			@header.render
			@input.render
			@page.render
		end

		Person.new(name: "Richard").create
		Payment.new(id: 1, for: Person.new(name: "Richard"), amount: 13.37, sign: :-).create
	end

	html do
		div.header!
		div.input!
		div.page!
	end

	css do
		rule 'body' do
			width 100.%
			height 100.%

			background '#fff'
			color '#222'
			font family: 'Quicksand'
			font size: 22.px

			text align: :center
		end

		rule 'a' do
			font weight: :bold
			color '#222'
			text decoration: :none
		end
	end
end
